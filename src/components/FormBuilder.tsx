'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addQuestionsToForm, createForm } from '@/lib/supabase';

interface QuestionData {
  id: string;
  text: string;
  timeLimit: number | null; // Time in seconds
}

const FormBuilder: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionData[]>([
    { id: crypto.randomUUID(), text: '', timeLimit: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Time limit options in seconds
  const timeLimitOptions = [
    { label: 'No limit', value: null },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '2 minutes', value: 120 },
    { label: '3 minutes', value: 180 },
    { label: '5 minutes', value: 300 }
  ];

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
      // In a real app, get the user ID from auth
      const userId = 'user-123'; // Placeholder user ID
      
      // Create the form
      const form = await createForm(userId, title, description);
      
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
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create a Connection Form</h1>
          <p className="text-gray-300">
            Create a form with thoughtful questions that will help connect people with similar perspectives and experiences.
          </p>
        </div>
        
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
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setActiveQuestionIndex(index)}
                        className={`w-full text-left px-4 py-3 rounded-md ${
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
                      </button>
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
      </div>
    </div>
  );
};

export default FormBuilder; 