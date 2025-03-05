'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Question, createResponse, submitAnswers } from '@/lib/supabase';
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
  const [timeSpent, setTimeSpent] = useState(0);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasTimeLimit = currentQuestion?.time_limit !== null;

  // Start timer when a new question is displayed
  useEffect(() => {
    if (!showIntro && !showOutro) {
      setStartTime(Date.now());
      setTimeSpent(0);

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
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
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
    if (!respondentName.trim() || !respondentEmail.trim()) {
      alert('Please provide your name and email');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a response record
      const response = await createResponse(form.id, null, respondentName, respondentEmail);
      
      // Submit all answers
      await submitAnswers(
        response.id,
        answers.map(answer => ({
          question_id: answer.questionId,
          text: answer.text,
          time_spent: answer.timeSpent
        }))
      );
      
      // Redirect to thank you page
      router.push(`/forms/${form.id}/thank-you`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit your responses. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Render intro screen
  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center border border-gray-200">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Almost Done!</h1>
            
            <div className="my-8">
              <p className="text-lg text-gray-700 mb-6 text-center">
                Thanks for completing the questions. Please provide your contact information to submit your responses.
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {hasTimeLimit && (
              <Timer
                seconds={currentQuestion.time_limit || 60}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQuestion.text}</h2>
            
            <textarea
              ref={answerInputRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full p-4 min-h-[150px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Type your answer here..."
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md font-medium"
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