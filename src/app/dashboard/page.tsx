'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { deleteForm, getUserForms, getCurrentUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Form } from '@/lib/supabase';

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndLoadForms() {
      try {
        setLoading(true);
        // First check if the user is authenticated
        const user = await getCurrentUser();
        
        if (!user) {
          console.error("Dashboard: No authenticated user found");
          setIsAuthenticated(false);
          setError("You must be logged in to view your dashboard");
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        console.log("Dashboard: Loading forms for user", user.id);
        
        // Now load the user's forms
        try {
          const userForms = await getUserForms(user.id);
          console.log("Dashboard: Loaded forms", userForms?.length || 0);
          setForms(userForms || []);
        } catch (formError: unknown) {
          const err = formError as Error & { message?: string };
          console.error("Error loading forms:", err);
          setError("Failed to load your forms: " + (err.message || "Unknown error"));
        }
      } catch (err: unknown) {
        const error = err as Error & { message?: string };
        console.error("Authentication error:", error);
        setIsAuthenticated(false);
        setError("Authentication error: " + (error.message || "Please try logging in again"));
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadForms();
  }, []);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (isAuthenticated === false) {
      // Wait a moment to show the error before redirecting
      const timeout = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, router]);

  const handleDelete = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteForm(formId);
      setForms(forms.filter(form => form.id !== formId));
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error("Error deleting form:", error);
      alert("Failed to delete form: " + (error.message || "Unknown error"));
    }
  };

  const copyFormLink = (formId: string) => {
    const formLink = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(formLink);
    
    // Create a temporary element for the toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-duke-blue text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
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

  return (
    <div className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Forms</h1>
          <Link 
            href="/forms/create" 
            className="px-5 py-3 bg-duke-blue text-white font-medium rounded-lg shadow-lg hover:bg-duke-lightblue transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Form
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-duke-lightblue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300">Loading your forms...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-800 text-white p-4 rounded-lg">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
            <p className="text-gray-400 mb-6">Create your first form to get started</p>
            <Link 
              href="/forms/create" 
              className="px-5 py-3 bg-duke-blue text-white font-medium rounded-lg shadow-lg hover:bg-duke-lightblue transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create First Form
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Form Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Responses</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {forms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium">{form.title}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(form.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {form.is_published ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-duke-blue bg-opacity-20 text-duke-lightblue">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        0 {/* Will be implemented in a future update */}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-3">
                          {form.is_published && (
                            <>
                              <button
                                onClick={() => copyFormLink(form.id)}
                                className="flex items-center px-2.5 py-1.5 bg-duke-blue bg-opacity-10 text-duke-lightblue rounded hover:bg-opacity-20 transition-colors"
                                title="Share Form"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                Share
                              </button>
                              
                              <Link
                                href={`/forms/${form.id}/results`}
                                className="text-duke-lightblue hover:text-white transition-colors"
                                title="View Results"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </Link>
                            </>
                          )}
                          
                          <Link
                            href={`/forms/edit/${form.id}`}
                            className="text-duke-lightblue hover:text-white transition-colors"
                            title="Edit Form"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-.707.707l-4 1a1 1 0 01-1.414-1.414l1-4a2 2 0 01.707-.707l10-10z" />
                            </svg>
                          </Link>
                          
                          {!form.is_published && (
                            <Link
                              href={`/forms/${form.id}/publish`}
                              className="text-duke-lightblue hover:text-white transition-colors"
                              title="Publish Form"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </Link>
                          )}
                          
                          <button
                            onClick={() => handleDelete(form.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Form"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-750 border-t border-gray-700">
              <div className="flex items-center text-sm text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Showing {forms.length} form{forms.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 