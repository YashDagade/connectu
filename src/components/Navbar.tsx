'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const pathname = usePathname();
  const router = useRouter();
  
  // Check actual authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
        
        if (user) {
          // Get the user's profile to display their name
          const profile = await getCurrentUserProfile();
          if (profile) {
            // Use display_name if available, otherwise use email or just first part of email
            const displayName = profile.display_name || 
                              (user.email ? user.email.split('@')[0] : 'User');
            setUserName(displayName);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          // Update user name when auth state changes
          const profile = await getCurrentUserProfile();
          if (profile) {
            const displayName = profile.display_name || 
                              (session.user.email ? session.user.email.split('@')[0] : 'User');
            setUserName(displayName);
          }
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-white font-bold text-xl">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-duke-lightblue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  ConnectU
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/' 
                    ? 'border-duke-blue text-white' 
                    : 'border-transparent text-gray-300 hover:border-gray-600 hover:text-white'
                }`}
              >
                Home
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/dashboard' 
                        ? 'border-duke-blue text-white' 
                        : 'border-transparent text-gray-300 hover:border-gray-600 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/forms/create"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/forms/create' 
                        ? 'border-duke-blue text-white' 
                        : 'border-transparent text-gray-300 hover:border-gray-600 hover:text-white'
                    }`}
                  >
                    Create Form
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">{userName}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-duke-blue hover:bg-duke-darkblue transition-colors shadow-md"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden bg-gray-900 border-t border-gray-800">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/' 
                  ? 'bg-gray-800 border-duke-blue text-white' 
                  : 'border-transparent text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white'
              }`}
            >
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/dashboard' 
                      ? 'bg-gray-800 border-duke-blue text-white' 
                      : 'border-transparent text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/forms/create"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/forms/create' 
                      ? 'bg-gray-800 border-duke-blue text-white' 
                      : 'border-transparent text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  Create Form
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-800">
            {isAuthenticated ? (
              <div className="space-y-1">
                <div className="px-4 py-2 text-base font-medium text-gray-300">Welcome, {userName}</div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/auth/login"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 