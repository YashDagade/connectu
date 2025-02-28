'use client';

import { useState, useEffect } from 'react';
import FormRenderer from '@/components/FormRenderer';
import { getFormById } from '@/lib/supabase';
import Link from 'next/link';

export default function FormPage({ params }: { params: { id: string } }) {
  // Access id directly from params for now
  // @ts-ignore - Suppressing TypeScript warning for now
  const formId = params.id;
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const { form, questions } = await getFormById(formId);
        setForm(form);
        setQuestions(questions);
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Could not load the form. It might not exist or has been deleted.');
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, [formId]);

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

  return <FormRenderer form={form} questions={questions} />;
} 