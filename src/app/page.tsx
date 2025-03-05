'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would process the email subscription
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white pt-24">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] bg-no-repeat bg-cover opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-duke-blue/20 to-duke-darkblue/10"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-6 py-2 border border-duke-lightblue rounded-full text-sm font-semibold mb-6 text-duke-lightblue">
              Human Connection Reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-white">Connect People With</span>
              <span className="block text-duke-lightblue mt-2">Meaningful Conversations</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Our proprietary algorithm analyzes written responses to capture personality traits, values,
              and communication styles to forge genuine connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-duke-blue text-white rounded-lg hover:bg-duke-lightblue shadow-lg transition-all text-lg font-medium"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="px-8 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg hover:bg-gray-700 transition-all text-lg font-medium"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#1F2937" fillOpacity="1" d="M0,192L60,186.7C120,181,240,171,360,176C480,181,600,203,720,186.7C840,171,960,117,1080,112C1200,107,1320,149,1380,170.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-duke-blue/20 rounded-full text-duke-lightblue text-sm font-semibold mb-4">
              POWERFUL FEATURES
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Features that make us different</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              ConnectU offers a revolutionary approach to connecting people based on their authentic responses.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md hover:border-duke-blue transition-all">
              <div className="h-12 w-12 bg-duke-blue/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-duke-lightblue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Timed Questions</h3>
              <p className="text-gray-300">
                Set time limits for each question to encourage more spontaneous and authentic
                responses that reveal true personality traits.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md hover:border-duke-blue transition-all">
              <div className="h-12 w-12 bg-duke-blue/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-duke-lightblue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Advanced Analysis</h3>
              <p className="text-gray-300">
                Our proprietary algorithm analyzes written responses to capture personality traits,
                values, and communication styles.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md hover:border-duke-blue transition-all">
              <div className="h-12 w-12 bg-duke-blue/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-duke-lightblue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Deeper Connections</h3>
              <p className="text-gray-300">
                Connect people based on genuine compatibility using deeper insights than
                traditional multiple-choice surveys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-xl text-gray-400 mb-8">Trusted by forward-thinking organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60">
              <span className="text-gray-400 text-xl font-bold">COMPANY 1</span>
              <span className="text-gray-400 text-xl font-bold">COMPANY 2</span>
              <span className="text-gray-400 text-xl font-bold">COMPANY 3</span>
              <span className="text-gray-400 text-xl font-bold">COMPANY 4</span>
              <span className="text-gray-400 text-xl font-bold">COMPANY 5</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-900 relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gray-800 to-transparent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-duke-blue/20 rounded-full text-duke-lightblue text-sm font-semibold mb-4">
              SIMPLE PROCESS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Create meaningful connections in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-duke-blue rounded-full flex items-center justify-center mb-6 shadow-lg relative">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Create a Form</h3>
              <p className="text-gray-300">
                Design your form with thoughtful questions and set time limits for responses.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-duke-blue rounded-full flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Share with Others</h3>
              <p className="text-gray-300">
                Send your form to participants and collect their authentic responses.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-duke-blue rounded-full flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Analyze Results</h3>
              <p className="text-gray-300">
                View detailed insights and discover meaningful connections between respondents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-duke-blue/20 rounded-full text-duke-lightblue text-sm font-semibold mb-4">
              TESTIMONIALS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Users Say</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real stories from people who've made meaningful connections through our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-duke-blue/20 flex items-center justify-center text-white text-xl font-bold">J</div>
                <div className="ml-4">
                  <h4 className="text-white font-semibold">John Doe</h4>
                  <p className="text-gray-400 text-sm">VP of Talent</p>
                </div>
              </div>
              <p className="text-gray-300">
                "ConnectU has revolutionized our team-building process. We've seen a remarkable improvement in team cohesion after using the platform to match colleagues based on communication styles."
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-duke-blue/20 flex items-center justify-center text-white text-xl font-bold">S</div>
                <div className="ml-4">
                  <h4 className="text-white font-semibold">Sarah Johnson</h4>
                  <p className="text-gray-400 text-sm">Community Lead</p>
                </div>
              </div>
              <p className="text-gray-300">
                "The depth of insight ConnectU provides is unmatched. It's not just about matching people—it's about understanding the why behind compatibility."
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 md:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-duke-blue/20 flex items-center justify-center text-white text-xl font-bold">M</div>
                <div className="ml-4">
                  <h4 className="text-white font-semibold">Michael Chen</h4>
                  <p className="text-gray-400 text-sm">University Director</p>
                </div>
              </div>
              <p className="text-gray-300">
                "Our student mentorship program has been transformed with ConnectU. The timed responses create authenticity that traditional matching systems miss completely."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-duke-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-dots.svg')] bg-repeat opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create meaningful connections?</h2>
            <p className="text-xl mb-10">
              Join the community of people making genuine connections based on who they truly are.
            </p>
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white text-black rounded-lg font-bold text-lg shadow-lg hover:bg-gray-100 transition-colors border border-blue-900"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1 bg-duke-blue/20 rounded-full text-duke-lightblue text-sm font-semibold mb-4">
                NEWSLETTER
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Stay Updated</h2>
              <p className="text-gray-300">
                Subscribe to our newsletter for the latest features and updates.
              </p>
            </div>
            
            {submitted ? (
              <div className="bg-duke-blue/20 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-duke-lightblue mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">Thank You!</h3>
                <p className="text-gray-300">You've been added to our newsletter.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-duke-blue focus:border-duke-lightblue"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-bold shadow-lg whitespace-nowrap border border-blue-900"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer Wave */}
      <div className="bg-gray-800 w-full overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#111827" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,186.7C672,171,768,117,864,96C960,75,1056,85,1152,96C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Final trusted by section with adjusted styles */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-400 mb-12">Trusted by forward-thinking organizations</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-bold">COMPANY 1</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-bold">COMPANY 2</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-bold">COMPANY 3</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-bold">COMPANY 4</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-bold">COMPANY 5</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
