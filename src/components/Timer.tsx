'use client'; // so that it renders on the client side and we can use state and effects

import { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

const Timer: React.FC<TimerProps> = ({ seconds, onTimeUp, isPaused = false }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(!isPaused);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      onTimeUp();
    }

    return () => clearInterval(interval);
  }, [timeLeft, isActive, onTimeUp]);

  useEffect(() => {
    setIsActive(!isPaused);
  }, [isPaused]);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  // Get color based on time left
  const getColor = (): string => {
    const percentLeft = (timeLeft / seconds) * 100;
    if (percentLeft > 50) return 'text-duke-blue';
    if (percentLeft > 25) return 'text-yellow-500';
    return 'text-red-500';
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
            className="text-gray-200"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={getColor()}
            stroke="currentColor"
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
          <span className={`text-sm font-medium ${getColor()}`}>{formatTime(timeLeft)}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">Time left</p>
    </div>
  );
};

export default Timer; 