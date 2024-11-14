"use client";

import { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

const loadingSteps = [
  { progress: 20, message: "Checking Google Trends..." },
  { progress: 40, message: "Analyzing news coverage..." },
  { progress: 60, message: "Searching Wikipedia..." },
  { progress: 80, message: "Calculating brand presence..." },
  { progress: 95, message: "Finalizing analysis..." },
];

export default function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(loadingSteps[0].message);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setMessage(loadingSteps[0].message);

      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const newProgress = Math.min(95, oldProgress + 1);
          
          // Update message based on progress
          const currentStep = loadingSteps.find(step => newProgress <= step.progress);
          if (currentStep) {
            setMessage(currentStep.message);
          }
          
          return newProgress;
        });
      }, 100);

      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        clearInterval(timer);
        setProgress(100);
        setMessage("Analysis complete!");
      }, 15000); // 15 second maximum

      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    } else {
      setProgress(100);
      setMessage("Analysis complete!");
    }
  }, [isLoading]);

  return (
    <div className={`transition-opacity duration-300 ${isLoading || progress < 100 ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
        {message}
      </div>
    </div>
  );
} 