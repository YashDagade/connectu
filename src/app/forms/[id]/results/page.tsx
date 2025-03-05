'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFormById, getFormResponses } from '@/lib/supabase';
import React from 'react';

export default function FormResultsPage({ params }: { params: { id: string } }) {
  // Unwrap params before accessing id property
  const unwrappedParams = React.use(params);
  const formId = unwrappedParams.id;
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFormAndResponses() {
      try {
        // Load form and questions
        const formData = await getFormById(formId);
        setForm(formData.form);
        setQuestions(formData.questions);

        // Load responses and answers
        const responsesData = await getFormResponses(formId);
        setResponses(responsesData.responses);
        setAnswers(responsesData.answers);
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Could not load the form responses. It might not exist or has been deleted.');
      } finally {
        setIsLoading(false);
      }
    }

    loadFormAndResponses();
  }, [formId]);

  // Helper function to get answers for a specific response
  const getResponseAnswers = (responseId: string) => {
    return answers.filter(answer => answer.response_id === responseId);
  };

  // Helper function to get answer for a specific question in a response
  const getAnswerForQuestion = (responseId: string, questionId: string) => {
    return answers.find(
      answer => answer.response_id === responseId && answer.question_id === questionId
    );
  };

  // Helper to format time spent
  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-duke-lightblue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-lg w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-4">Form Not Found</h1>
          <p className="text-gray-300 mb-6">{error || 'The form you are looking for does not exist or is no longer available.'}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors inline-block shadow-lg">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{form.title} - Responses</h1>
            <p className="text-gray-300">{responses.length} {responses.length === 1 ? 'response' : 'responses'} received</p>
          </div>
          <Link 
            href="/dashboard" 
            className="px-5 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors inline-flex items-center border border-gray-700 shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {responses.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">No Responses Yet</h2>
            <p className="text-gray-300 mb-6">This form has not received any responses yet.</p>
            <Link 
              href={`/forms/${formId}`}
              className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors inline-block shadow-lg"
            >
              View Form
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Respondent</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    {questions.map((question) => (
                      <th key={question.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {question.text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {responses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-white">{response.respondent_name}</div>
                            <div className="text-sm text-gray-400">{response.respondent_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(response.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      {questions.map((question) => {
                        const answer = getAnswerForQuestion(response.id, question.id);
                        return (
                          <td key={`${response.id}-${question.id}`} className="px-6 py-4">
                            {answer ? (
                              <div>
                                <div className="text-sm text-white">{answer.text}</div>
                                <div className="text-xs text-duke-lightblue mt-1">
                                  Time spent: {formatTimeSpent(answer.time_spent)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No answer</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Export Options</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => alert('CSV export feature coming soon!')}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export as CSV
            </button>
            <button 
              onClick={() => alert('PDF export feature coming soon!')}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Export as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 