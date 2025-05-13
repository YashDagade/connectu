'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { addQuestionsToForm, createForm, getCurrentUser } from '@/lib/supabase';

interface QuestionData {
  id: string;
  text: string;
  timeLimit: number | null; // Time in seconds
}

const FormBuilder: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionData[]>([{ id: uuidv4(), text: '', timeLimit: null }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Time limit options in seconds
  const timeLimitOptions = [
    { label: 'No limit', value: null },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '2 minutes', value: 120 },
    { label: '3 minutes', value: 180 },
    { label: '5 minutes', value: 300 }
  ];

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setAuthError('You must be logged in to create a form. Please log in and try again.');
        } else {
          // Clear any auth error if user is logged in
          setAuthError(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthError('Failed to verify authentication status. Please refresh the page and try again.');
      }
    };
    
    checkAuth();
  }, []);

  const addQuestion = () => {
    const newQuestion = { id: crypto.randomUUID(), text: '', timeLimit: null };
    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    const newQuestions = questions.filter(q => q.id !== id);
    setQuestions(newQuestions);
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, text } : q)));
  };

  const updateTimeLimit = (id: string, timeLimit: number | null) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, timeLimit } : q)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please add a title for your form');
      return;
    }
    
    if (questions.some(q => !q.text.trim())) {
      alert('Please fill out all questions');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the current authenticated user
      const user = await getCurrentUser();
      
      if (!user) {
        setAuthError('You must be logged in to create a form. Please log in and try again.');
        return;
      }
      
      // Create the form with the authenticated user's ID
      const form = await createForm(user.id, title, description);
      
      // Add questions to the form
      await addQuestionsToForm(
        form.id,
        questions.map((q, index) => ({
          text: q.text,
          time_limit: q.timeLimit,
          order: index
        }))
      );
      
      // Redirect to the form preview
      router.push(`/forms/${form.id}`);
    } catch (error: unknown) {
      console.error('Error creating form:', error);
      
      const err = error as Error & { message?: string; status?: number };
      // Check if it's an authentication error
      if (err.message?.includes('auth') || err.message?.includes('authenticated') || err.status === 401) {
        setAuthError('Your session has expired. Please log in again to create a form.');
      } else {
        alert('Failed to create form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white py-12 w-full h-full">
      <div className="max-w-4xl mx-auto p-4">
        {authError ? (
          <div className="bg-red-800 p-4 rounded-md mb-6">
            <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
            <p>{authError}</p>
            <button 
              onClick={() => router.push('/auth/login')}
              className="mt-4 px-4 py-2 bg-white text-red-800 rounded-md hover:bg-gray-200 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-white mb-1">
                  Form Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your form a meaningful title"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-lightblue transition-colors"
                  required
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
                  placeholder="Describe what this form is about and how the responses will be used"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-lightblue transition-colors"
                />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-medium text-white">Questions</h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-2 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors shadow-md flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Question
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-gray-700 pr-0 md:pr-4 mb-4 md:mb-0">
                    <div className="space-y-2">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          onClick={() => setActiveQuestionIndex(index)}
                          className={`w-full text-left px-4 py-3 rounded-md cursor-pointer ${
                            activeQuestionIndex === index
                              ? 'bg-duke-blue text-white'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">
                              {question.text ? question.text.substring(0, 20) + (question.text.length > 20 ? '...' : '') : `Question ${index + 1}`}
                            </span>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeQuestion(question.id);
                                }}
                                className="text-gray-400 hover:text-red-400 font-bold text-lg"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-3/4 pl-0 md:pl-6">
                    {questions[activeQuestionIndex] && (
                      <div className="space-y-6">
                        <div>
                          <label htmlFor={`question-${activeQuestionIndex}`} className="block text-sm font-medium text-white mb-1">
                            Question Text
                          </label>
                          <textarea
                            id={`question-${activeQuestionIndex}`}
                            value={questions[activeQuestionIndex].text}
                            onChange={(e) => updateQuestion(questions[activeQuestionIndex].id, e.target.value)}
                            placeholder="Type your question here"
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-lightblue transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`time-limit-${activeQuestionIndex}`} className="block text-sm font-medium text-white mb-1">
                            Time Limit
                          </label>
                          <select
                            id={`time-limit-${activeQuestionIndex}`}
                            value={questions[activeQuestionIndex].timeLimit?.toString() || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              updateTimeLimit(questions[activeQuestionIndex].id, value);
                            }}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-lightblue transition-colors"
                          >
                            {timeLimitOptions.map((option) => (
                              <option key={option.value || 'null'} value={option.value || ''}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-sm text-gray-400">
                            Set a time limit for how long respondents have to answer this question.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue focus:outline-none focus:ring-2 focus:ring-duke-lightblue focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center font-medium shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Form...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Create Form
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FormBuilder; 