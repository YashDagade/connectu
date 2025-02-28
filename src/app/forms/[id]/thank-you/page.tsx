'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFormById } from '@/lib/supabase';
import { Form } from '@/lib/supabase';

export default function ThankYouPage({ params }: { params: { id: string } }) {
  // Access id directly from params for now
  // @ts-ignore - Suppressing TypeScript warning for now 
  const formId = params.id;
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadForm() {
      try {
        const { form } = await getFormById(formId);
        setForm(form);
      } catch (error) {
        console.error('Error loading form:', error);
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-form-card p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-duke-blue mb-4">Thank You!</h1>
          
          <div className="my-6">
            <p className="text-lg text-gray-700 mb-4">
              Your responses to "{form?.title || 'the form'}" have been successfully submitted.
            </p>
            <p className="text-gray-600">
              When the form creator finalizes the connections, you'll receive an email with your matches.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              href="/"
              className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-darkblue transition-colors inline-block"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 