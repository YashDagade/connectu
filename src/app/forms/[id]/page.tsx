'use client';

import { useState, useEffect, use } from 'react';
import FormRenderer from '@/components/FormRenderer';
import { getFormById, getCurrentUser } from '@/lib/supabase';
import Link from 'next/link';

export default function FormPage({ params }: { params: { id: string } }) {
  // Properly unwrap params with React.use()
  const unwrappedParams = use(params);
  const formId = unwrappedParams.id;
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        const { form, questions } = await getFormById(formId);
        setForm(form);
        setQuestions(questions);
        
        try {
          // Check if current user is the form owner - wrapped in try/catch to avoid errors for anonymous users
          const currentUser = await getCurrentUser();
          if (currentUser && form.user_id === currentUser.id) {
            setIsOwner(true);
          }
        } catch (userError) {
          // Silently handle authentication errors for anonymous users
          console.log('Anonymous user viewing the form');
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Could not load the form. It might not exist or has been deleted.');
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, [formId]);

  const shareForm = () => {
    const formLink = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(formLink);
    
    // Create a temporary element for the toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-md shadow-lg z-50 flex items-center';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>Form link copied to clipboard!</span>
    `;
    document.body.appendChild(toast);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-duke-blue mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-form-card p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Form Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The form you are looking for does not exist or is no longer available.'}</p>
          <Link href="/" className="px-6 py-2 bg-duke-blue text-white rounded-md hover:bg-duke-darkblue transition-colors inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!form.is_published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-form-card p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Form Not Yet Published</h1>
          <p className="text-gray-600 mb-6">This form is still being created and is not yet available for responses.</p>
          <Link href="/" className="px-6 py-2 bg-duke-blue text-white rounded-md hover:bg-duke-darkblue transition-colors inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isOwner && (
        <div className="bg-gray-100 p-4 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Form Owner Controls</h2>
            <div className="flex gap-4">
              <button
                onClick={shareForm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share Form
              </button>
              <Link 
                href={`/forms/${formId}/connections`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Connections
              </Link>
              <Link 
                href={`/forms/${formId}/results`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Results
              </Link>
            </div>
          </div>
        </div>
      )}
      <FormRenderer form={form} questions={questions} />
    </div>
  );
} 