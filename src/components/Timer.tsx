'use client'; // so that it renders on the client side and we can use state and effects

import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  seconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

const Timer: React.FC<TimerProps> = ({ seconds, onTimeUp, isPaused = false }) => {
  // Main state for the timer
  const [timeLeft, setTimeLeft] = useState(seconds);
  
  // References to maintain across renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Format time as MM:SS
  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Calculate percentage for the progress ring
  const calculateProgress = (): number => {
    return ((seconds - timeLeft) / seconds) * 100;
  };

  // Initialize or reset timer when seconds prop changes
  useEffect(() => {
    // Set initial values
    const nowTime = Date.now();
    startTimeRef.current = nowTime;
    endTimeRef.current = nowTime + seconds * 1000;
    setTimeLeft(seconds);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [seconds]);

  // Main timer effect
  useEffect(() => {
    // Don't run if paused
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Clear any existing interval before setting a new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Function to update the timer
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      
      // Set the new time left
      setTimeLeft(remaining);
      
      // Check if time is up
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onTimeUp();
      }
    };
    
    // Initial update
    updateTimer();
    
    // Set up the interval - use a slightly shorter interval to avoid missing seconds
    timerRef.current = setInterval(updateTimer, 500);
    
    // Clean up
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, onTimeUp, seconds]);

  // Get color based on time left
  const getColor = (): string => {
    const percentLeft = (timeLeft / seconds) * 100;
    if (percentLeft > 50) return '#012169'; // Duke blue
    if (percentLeft > 25) return '#E6A701'; // Brighter yellow
    return '#DC2626'; // Brighter red
  };

  // SVG parameters for the progress ring
  const size = 90; // Increased from 60
  const strokeWidth = 5; // Slightly thicker stroke
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (calculateProgress() / 100) * circumference;
  const currentColor = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={size} width={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="#D1D5DB" // Gray-300
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            stroke={currentColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            r={radius}
            cx={size / 2}
            cy={size / 2}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-xl font-bold" // Increased text size
            style={{ 
              color: currentColor,
              textShadow: '0px 0px 2px white, 0px 0px 4px white' 
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      {/* Placed inside the bottom of the circle with better positioning */}
      <div className="relative" style={{ marginTop: '-10px' }}>
        <p className="text-xs font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200" style={{ color: '#374151' }}>
          Time left
        </p>
      </div>
    </div>
  );
};

export default Timer; 