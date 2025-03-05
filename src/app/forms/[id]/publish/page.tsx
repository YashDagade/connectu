'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFormById, publishForm } from '@/lib/supabase';
import Link from 'next/link';
import React from 'react';

export default function PublishFormPage({ params }: { params: { id: string } }) {
  // Unwrap params before accessing id property
  const unwrappedParams = React.use(params);
  const formId = unwrappedParams.id;
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        const { form, questions } = await getFormById(formId);
        setForm(form);
        setQuestions(questions);
        
        // If form is already published, set the published state
        if (form.is_published) {
          setIsPublished(true);
          setFormLink(`${window.location.origin}/forms/${formId}`);
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Could not load the form. It might not exist or has been deleted.');
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, [formId, router]);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      await publishForm(formId);
      
      // Generate a shareable link
      const link = `${window.location.origin}/forms/${formId}`;
      setFormLink(link);
      
      // Set published state
      setIsPublished(true);
      setIsPublishing(false);
    } catch (error) {
      console.error('Error publishing form:', error);
      setError('Failed to publish the form. Please try again.');
      setIsPublishing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formLink);
      setCopySuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Please fill out my form: ${form.title}`);
    const body = encodeURIComponent(`I'd like you to fill out this form:\n\n${formLink}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
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

  if (isPublished) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Form Published!</h1>
              <p className="text-gray-300">
                Your form is now live and ready to be shared. Use the options below to share it with others.
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-white mb-4">Share Your Form</h2>
              
              <div className="flex flex-col space-y-4">
                <div>
                  <label htmlFor="form-link" className="block text-sm font-medium text-gray-300 mb-2">
                    Form Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="form-link"
                      value={formLink}
                      readOnly
                      className="flex-grow p-2 rounded-l border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-duke-blue"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-duke-blue text-white rounded-r hover:bg-duke-lightblue transition-colors"
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-300 mb-4">Or share directly via:</p>
                  <div className="flex space-x-4">
                    <button
                      onClick={shareViaEmail}
                      className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <Link 
                href={`/forms/${formId}`}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-center shadow-md flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                View Form
              </Link>
              <Link 
                href="/dashboard"
                className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors text-center shadow-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Ready to Publish Your Form?</h1>
            <p className="text-gray-300">
              Preview your form details below before making it available for responses.
            </p>
          </div>
          
          <div className="mb-8 p-6 bg-gray-700 rounded-lg border border-gray-600">
            <h2 className="text-xl font-semibold mb-4 text-white">{form.title}</h2>
            <p className="text-gray-300 mb-6">{form.description}</p>
            
            <h3 className="text-lg font-medium mb-3 text-white">Questions ({questions.length})</h3>
            <ul className="space-y-3">
              {questions.map((question, index) => (
                <li key={question.id} className="p-3 bg-gray-800 rounded border border-gray-600">
                  <div className="flex items-start">
                    <span className="font-medium text-duke-lightblue mr-2">{index + 1}.</span>
                    <div>
                      <p className="text-white">{question.text}</p>
                      {question.time_limit && (
                        <p className="text-sm text-duke-lightblue mt-1">
                          Time limit: {question.time_limit < 60 
                            ? `${question.time_limit} seconds` 
                            : `${Math.floor(question.time_limit / 60)} minute${question.time_limit >= 120 ? 's' : ''}`}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <Link 
              href={`/forms/edit/${formId}`}
              className="px-6 py-3 border border-gray-500 text-white rounded-md hover:bg-gray-700 transition-colors text-center shadow-md"
            >
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-.707.707l-4 1a1 1 0 01-1.414-1.414l1-4a2 2 0 01.707-.707l10-10z" />
                </svg>
                Edit Form
              </span>
            </Link>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-lightblue transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
            >
              {isPublishing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Publish Form
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 