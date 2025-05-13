'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFormById } from '@/lib/supabase';

// Remove mock data and implement real fetching
export default function RespondToForm() {
  const params = useParams();
  const router = useRouter();
  const formId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [form, setForm] = useState<{
    id: string;
    title: string;
    description: string;
    is_accepting_responses: boolean;
  } | null>(null);
  const [questions, setQuestions] = useState<{
    id: string;
    text: string;
    order: number;
    time_limit: number | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchFormData = useCallback(async () => {
    try {
      const { form, questions } = await getFormById(formId);
      setForm(form);
      setQuestions(questions);
    } catch (err) {
      console.error('Error fetching form:', err);
      setError('Could not load the form. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [formId]);
  
  useEffect(() => {
    if (formId) {
      fetchFormData();
    }
  }, [formId, fetchFormData]);
  
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };
  
  const isFormComplete = () => {
    if (!name || !email || !form || !questions) return false;
    
    // Check if all questions have responses
    for (const question of questions) {
      if (!responses[question.id] || responses[question.id].trim() === '') {
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    // Format the answers for submission
    const formattedAnswers = questions.map(question => ({
      question_id: question.id,
      text: responses[question.id],
      time_spent: 0 // We don't track time in this form, but the API requires it
    }));
    
    try {
      // Use server API route for all submissions for better reliability
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formId,
          name: name,
          email: email,
          answers: formattedAnswers
        }),
      });
      
      // Always parse the response for error messages
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Server responded with status ${response.status}`);
      }
      
      console.log('Form submission successful:', result);
      
      // Navigate to thank you page
      router.push(`/forms/${formId}/thank-you`);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Form not found or no longer available.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        <p className="text-gray-600 mb-4">{form.description}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-8 border-b pb-6">
          <h2 className="text-lg font-medium mb-4">Your Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Questions</h2>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="p-4 bg-gray-50 rounded-md">
                <label className="block text-md font-medium mb-2">
                  {index + 1}. {question.text}
                </label>
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Your answer"
                  required
                />
              </div>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <div className="font-medium">Submission Error</div>
            <p>{error}</p>
            {error.includes('logged in') && (
              <div className="mt-3">
                <a 
                  href="/auth/login" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign In
                </a>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isFormComplete() || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : 'Submit Responses'}
          </button>
        </div>
      </form>
    </div>
  );
} 