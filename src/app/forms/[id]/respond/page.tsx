'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock form data for demonstration
const mockForm = {
  id: '1',
  title: 'Meaningful Connections',
  description: 'Answer these questions to help us match you with compatible connections.',
  createdBy: 'John Doe',
  questions: [
    { id: '1', text: 'What do you think are the defining problems of our generation?' },
    { id: '2', text: 'What are some non-traditional things you did growing up?' },
    { id: '3', text: 'Where are you an outlier?' },
    { id: '4', text: 'What do you do purely for the joy it brings?' }
  ]
};

export default function RespondToForm({ params }: { params: { id: string } }) {
  const formId = params.id;
  const router = useRouter();
  const [form] = useState(mockForm); // In a real app, we'd fetch the form by ID
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };
  
  const isFormComplete = () => {
    if (!name || !email) return false;
    
    // Check if all questions have responses
    for (const question of form.questions) {
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
    
    try {
      // In a real app, we would:
      // 1. Submit the responses to the backend
      // 2. Convert responses to embeddings using OpenAI
      // 3. Store the embeddings in Qdrant for matching
      
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to a thank you page
      router.push(`/forms/${formId}/thank-you`);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error state
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        <p className="text-gray-600 mb-4">{form.description}</p>
        <div className="text-sm text-gray-500">Created by {form.createdBy}</div>
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
            {form.questions.map((question, index) => (
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
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isFormComplete() || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Responses'}
          </button>
        </div>
      </form>
    </div>
  );
} 