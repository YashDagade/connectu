'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/lib/supabase';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const pathname = usePathname();
  
  // Check actual authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        console.log("Navbar: Checking authentication");
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        
        console.log("Navbar: User authenticated?", !!user);
        setIsAuthenticated(!!user);
        
        if (user) {
          console.log("Navbar: Fetching user profile");
          // Try to get the user's profile to display their name
          try {
            const profile = await getCurrentUserProfile();
            console.log("Navbar: Profile loaded?", !!profile);
            
            if (profile && profile.display_name) {
              // Use display_name if available
              console.log("Navbar: Setting user name from profile display_name:", profile.display_name);
              setUserName(profile.display_name);
            } else if (profile && profile.email) {
              // Use profile email as fallback
              console.log("Navbar: Setting user name from profile email:", profile.email.split('@')[0]);
              setUserName(profile.email.split('@')[0]);
            } else if (user.email) {
              // Fallback to auth user email if no profile or profile without name/email
              console.log("Navbar: Setting user name from auth email:", user.email.split('@')[0]);
              setUserName(user.email.split('@')[0]);
            } else {
              // Ultimate fallback
              console.log("Navbar: No identifiable user info, using 'User'");
              setUserName('User');
            }
          } catch (profileError) {
            console.error("Error loading profile:", profileError instanceof Error ? profileError.message : JSON.stringify(profileError));
            // Still set basic info from user if profile fails
            if (user.email) {
              console.log("Navbar: Setting user name from auth email after profile error:", user.email.split('@')[0]);
              setUserName(user.email.split('@')[0]);
            }
          }
        } else {
          // Clear user name if not authenticated
          setUserName('');
        }
      } catch (error) {
        console.error("Error checking auth:", error instanceof Error ? error.message : JSON.stringify(error));
        setIsAuthenticated(false);
        setUserName('');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Navbar: Auth state changed:", event);
        const isAuthed = !!session?.user;
        setIsAuthenticated(isAuthed);
        
        if (isAuthed && session?.user) {
          // Update user name when auth state changes
          try {
            const profile = await getCurrentUserProfile();
            if (profile) {
              const displayName = profile.display_name || 
                              (session.user.email ? session.user.email.split('@')[0] : 'User');
              setUserName(displayName);
            } else if (session.user.email) {
              setUserName(session.user.email.split('@')[0]);
            }
          } catch (error) {
            console.error("Error updating profile after auth change:", error);
            if (session.user.email) {
              setUserName(session.user.email.split('@')[0]);
            }
          }
        } else {
          // Explicitly clear user name when signed out
          setUserName('');
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      console.log("Navbar: Signing out");
      
      // Remove any temporary local session state
      setIsAuthenticated(false);
      setUserName('');  // Don't set to 'User', clear it completely
      
      // Perform the sign out operation
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out API error:", JSON.stringify(error));
        throw error;
      }
      
      console.log("Navbar: Sign out successful");
      
      // Force clear any potential Supabase session data from storage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('connectu-auth-token');
      } catch (storageError) {
        console.error('Failed to clear local storage:', storageError);
      }
      
      // Create a toast message that will be shown on the landing page
      const createSignOutToast = () => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg z-50 flex items-center';
        toast.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>You have been signed out successfully</span>
        `;
        document.body.appendChild(toast);
        
        // Remove the toast after 4 seconds
        setTimeout(() => {
          toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
          setTimeout(() => {
            if (document.body.contains(toast)) {
              document.body.removeChild(toast);
            }
          }, 300);
        }, 4000);
      };
      
      // Force a hard refresh to the home page
      window.location.href = '/?signout=success';
      
      // Add event to show toast after navigation completes
      window.addEventListener('load', createSignOutToast);
      
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : JSON.stringify(error));
      
      // Even if sign-out via API fails, we'll force a sign-out by clearing storage and redirecting
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('connectu-auth-token');
      } catch (storageError) {
        console.error('Failed to clear local storage:', storageError);
      }
      
      // Force a hard refresh to the home page
      window.location.href = '/?signout=success';
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
                {isLoading ? (
                  <div className="h-5 w-20 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <span className="text-sm text-gray-300">{userName}</span>
                )}
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
                {isLoading ? (
                  <div className="h-5 w-24 bg-gray-700 animate-pulse rounded mx-4 my-2"></div>
                ) : (
                  <div className="px-4 py-2 text-base font-medium text-gray-300">Welcome, {userName}</div>
                )}
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