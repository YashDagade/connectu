'use client'; // so that it renders on the client side and we can use state and effects

import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  seconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

const Timer: React.FC<TimerProps> = ({ seconds, onTimeUp, isPaused = false }) => {
  // Use a ref to store the end time to avoid issues with stale closures
  const endTimeRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(!isPaused);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate percentage for the progress ring
  const calculateProgress = (): number => {
    return ((seconds - timeLeft) / seconds) * 100;
  };

  // Start the timer
  const startTimer = () => {
    // Clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Set the end time
    endTimeRef.current = Date.now() + timeLeft * 1000;

    // Set up the interval
    intervalIdRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        onTimeUp();
      }
    }, 500); // Run every 500ms for smoother updates
  };

  // Stop the timer
  const stopTimer = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // Initialize timer on mount with clean reset
  useEffect(() => {
    // Initialize with fresh state on mount
    setTimeLeft(seconds);
    endTimeRef.current = Date.now() + seconds * 1000;
    
    // Start timer if active
    if (!isPaused) {
      startTimer();
    }
    
    // Cleanup on unmount
    return () => {
      stopTimer();
    };
  }, []); // Empty dependency array ensures this only runs on mount

  // Reset the timer when seconds prop changes
  useEffect(() => {
    setTimeLeft(seconds);
    if (isActive && !isPaused) {
      endTimeRef.current = Date.now() + seconds * 1000;
      startTimer();
    }
  }, [seconds]);

  // Handle active state changes
  useEffect(() => {
    setIsActive(!isPaused);
    
    if (isPaused) {
      stopTimer();
    } else if (timeLeft > 0) {
      startTimer();
    }
    
    return () => stopTimer();
  }, [isPaused]);

  // Get color based on time left
  const getColor = (): string => {
    const percentLeft = (timeLeft / seconds) * 100;
    if (percentLeft > 50) return '#012169'; // Duke blue
    if (percentLeft > 25) return '#E6A701'; // Brighter yellow
    return '#DC2626'; // Brighter red
  };

  // SVG parameters for the progress ring
  const size = 60;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (calculateProgress() / 100) * circumference;

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
            stroke={getColor()}
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
            className="text-sm font-bold" 
            style={{ 
              color: getColor(),
              textShadow: '0px 0px 2px white, 0px 0px 4px white' 
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      <div className="mt-1 shadow-sm" style={{ transform: 'translateY(-3px)' }}>
        <p className="text-xs font-medium bg-white px-3 py-1 rounded-full shadow-sm" style={{ color: '#374151' }}>
          Time left
        </p>
      </div>
    </div>
  );
};

export default Timer; 