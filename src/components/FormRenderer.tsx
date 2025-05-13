'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Question } from '@/lib/supabase';
import Timer from './Timer';

interface FormRendererProps {
  form: Form;
  questions: Question[];
}

interface AnswerData {
  questionId: string;
  text: string;
  timeSpent: number;
}

const FormRenderer: React.FC<FormRendererProps> = ({ form, questions }) => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasTimeLimit = currentQuestion?.time_limit !== null;

  // Start timer when a new question is displayed
  useEffect(() => {
    if (!showIntro && !showOutro) {
      setStartTime(Date.now());

      // Focus the answer input
      setTimeout(() => {
        if (answerInputRef.current) {
          answerInputRef.current.focus();
        }
      }, 100);
    }
  }, [currentQuestionIndex, showIntro, showOutro]);

  // Update time spent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (startTime && !showIntro && !showOutro) {
      interval = setInterval(() => {
        // No need to update timeSpent as it's not used in the component
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [startTime, showIntro, showOutro]);

  const handleTimeUp = () => {
    // Auto-submit the current answer when time is up
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    // Calculate time spent
    const seconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    // Save the current answer
    if (!showIntro && !showOutro) {
      const newAnswer: AnswerData = {
        questionId: currentQuestion.id,
        text: currentAnswer.trim(),
        timeSpent: seconds
      };
      
      setAnswers([...answers, newAnswer]);
    }
    
    // Move to the next question or submit
    if (isLastQuestion) {
      setShowOutro(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    }
  };

  const startForm = () => {
    setShowIntro(false);
  };

  const handleSubmit = async () => {
    // Clear any previous errors
    setError(null);
    
    // Email validation regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if (!respondentName.trim()) {
      setError('Please provide your name');
      return;
    }
    
    if (!respondentEmail.trim()) {
      setError('Please provide your email address');
      return;
    }
    
    if (!emailRegex.test(respondentEmail.trim())) {
      setError('Please provide a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    // Format the answers for submission
    const formattedAnswers = answers.map(answer => ({
      question_id: answer.questionId,
      text: answer.text,
      time_spent: answer.timeSpent
    }));
    
    try {
      // Use the server API route for all submissions
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          name: respondentName,
          email: respondentEmail,
          answers: formattedAnswers
        }),
      });
      
      // Parse the response even if it's an error
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Server responded with status ${response.status}`);
      }
      
      console.log('Form submission successful:', result);
      
      // Redirect to thank you page
      router.push(`/forms/${form.id}/thank-you`);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error instanceof Error) {
        setError(`${error.message}`);
      } else {
        setError('An unknown error occurred. Please try again later or contact support.');
      }
      
      setIsSubmitting(false);
    }
  };

  // Handle key command for next question
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check for Command+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleNextQuestion();
    }
  };

  // Render intro screen
  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center border border-gray-300" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{form.title}</h1>
            
            <div className="my-8">
              <p className="text-lg text-gray-700 mb-4">{form.description}</p>
              <div className="text-gray-600 mb-8">
                <p className="mb-2">This form contains {questions.length} question{questions.length !== 1 ? 's' : ''}.</p>
                {questions.some(q => q.time_limit !== null) && (
                  <p className="text-amber-600 font-semibold p-2 bg-amber-50 rounded-md inline-block">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Some questions have time limits. Be ready to answer within the given time.
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={startForm}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 shadow-lg font-medium"
              style={{ backgroundColor: '#012169' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#001A57'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#012169'}
            >
              Start Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render outro (submission) screen
  if (showOutro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center border border-gray-300" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Your Responses</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <div className="font-medium">Submission Error</div>
                <p>{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Thank you for completing the questions! Please provide your information below to submit your responses.
              </p>
              
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('email')?.focus();
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-4 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg font-medium"
                style={{ backgroundColor: isSubmitting ? '#9CA3AF' : '#012169' }}
                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#001A57')}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = isSubmitting ? '#9CA3AF' : '#012169'}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Responses'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render question screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-white px-2 py-1 rounded text-gray-800 font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-48 h-4 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ 
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    backgroundColor: '#012169'
                  }}
                ></div>
              </div>
            </div>
            
            {hasTimeLimit && (
              <div className="bg-white p-2 rounded-full shadow-md border border-gray-200">
                <Timer
                  key={`question-timer-${currentQuestionIndex}`}
                  seconds={currentQuestion.time_limit || 60}
                  onTimeUp={handleTimeUp}
                />
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQuestion.text}</h2>
            
            <textarea
              ref={answerInputRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-4 min-h-[150px] border border-gray-300 rounded-md text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue transition-colors placeholder-gray-500"
              placeholder="Type your answer here..."
              style={{ color: '#000000' }}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md font-medium"
              style={{ backgroundColor: '#012169' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#001A57'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#012169'}
            >
              {isLastQuestion ? 'Finish' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormRenderer; 