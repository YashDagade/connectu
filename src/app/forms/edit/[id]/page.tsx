'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getFormById, addQuestionsToForm, updateForm, updateQuestion, deleteQuestion } from '@/lib/supabase';

export default function EditFormPage() {
  const params = useParams();
  const formId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Array<{ 
    id?: string;
    text: string; 
    time_limit: number | null; 
    order: number;
  }>>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Array<{ 
    id: string;
    text: string; 
    time_limit: number | null; 
    order: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time limit options
  const timeLimitOptions = [
    { value: null, label: 'No limit' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes' },
    { value: 300, label: '5 minutes' },
  ];

  useEffect(() => {
    async function loadForm() {
      try {
        const { form, questions: formQuestions } = await getFormById(formId);
        
        setTitle(form.title);
        setDescription(form.description);
        
        // Sort questions by order
        const sortedQuestions = [...formQuestions].sort((a, b) => a.order - b.order);
        setQuestions(sortedQuestions);
        setOriginalQuestions(sortedQuestions);
        
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Could not load the form. It might not exist or has been deleted.');
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, [formId]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        time_limit: null,
        order: questions.length
      }
    ]);
  };

  const handleRemoveQuestion = async (index: number) => {
    if (questions.length === 1) {
      // Don't allow removing the last question
      return;
    }
    
    const questionToRemove = questions[index];
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    
    // Update order of remaining questions
    updatedQuestions.forEach((q, i) => {
      q.order = i;
    });
    
    setQuestions(updatedQuestions);
    
    // If this is an existing question that's stored in the database, delete it
    if (questionToRemove.id) {
      try {
        await deleteQuestion(questionToRemove.id);
      } catch (error) {
        console.error('Error deleting question:', error);
        // We don't show an error to the user since the question is already removed from the UI
        // In a production app, you might want to handle this differently
      }
    }
  };

  const handleQuestionChange = (index: number, field: 'text' | 'time_limit', value: string | number | null) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  const handleSaveForm = async () => {
    // Basic validation
    if (!title.trim()) {
      setError('Please enter a form title');
      return;
    }

    if (questions.some(q => !q.text.trim())) {
      setError('Please fill in all question fields');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update form details
      await updateForm(formId, { title, description });
      
      // Handle existing questions (update them)
      const existingQuestions = questions.filter(q => q.id);
      for (const question of existingQuestions) {
        if (question.id) {
          const originalQuestion = originalQuestions.find(q => q.id === question.id);
          
          // Only update if something changed
          if (originalQuestion && 
              (originalQuestion.text !== question.text || 
               originalQuestion.time_limit !== question.time_limit ||
               originalQuestion.order !== question.order)) {
            await updateQuestion(question.id, {
              text: question.text,
              time_limit: question.time_limit,
              order: question.order
            });
          }
        }
      }
      
      // Add new questions
      const newQuestions = questions.filter(q => !q.id);
      if (newQuestions.length > 0) {
        await addQuestionsToForm(formId, newQuestions);
      }
      
      // Redirect to the publish page
      router.push(`/forms/${formId}/publish`);
    } catch (error) {
      console.error('Error saving form:', error);
      setError('Failed to save the form. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-duke-lightblue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-lg w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-4">Form Not Found</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors inline-block shadow-lg">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Form</h1>
            <p className="text-gray-300">
              Update your form details and questions
            </p>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-1">
                Form Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-duke-blue focus:border-duke-lightblue"
                placeholder="Enter a descriptive title for your form"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-duke-blue focus:border-duke-lightblue"
                placeholder="Explain what the form is about"
              />
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Questions</h2>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors shadow-md flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Question
                </button>
              </div>
              
              {questions.map((question, index) => (
                <div key={question.id || index} className="bg-gray-700 rounded-lg p-4 mb-4 border border-gray-600">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-medium">Question {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      disabled={questions.length === 1}
                      className={`p-1 rounded-full ${questions.length === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:bg-red-900/30 hover:text-white'}`}
                      title={questions.length === 1 ? "Can't remove the only question" : "Remove question"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                      Question Text
                    </label>
                    <textarea
                      id={`question-${index}`}
                      value={question.text}
                      onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-duke-blue focus:border-duke-lightblue"
                      placeholder="Enter your question"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor={`time-limit-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                      Time Limit
                    </label>
                    <select
                      id={`time-limit-${index}`}
                      value={question.time_limit === null ? '' : question.time_limit}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        handleQuestionChange(index, 'time_limit', value);
                      }}
                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-duke-blue focus:border-duke-lightblue"
                    >
                      {timeLimitOptions.map((option) => (
                        <option key={option.value || 'null'} value={option.value || ''}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-500 text-white rounded-md hover:bg-gray-700 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={isSaving}
                className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue focus:outline-none focus:ring-2 focus:ring-duke-lightblue focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 