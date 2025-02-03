"use client";

import { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

const loadingSteps = [
  { progress: 5, message: "Initializing analysis...", time: 1000 },
  // Trends and initial data fetch (about 70% of time)
  { progress: 15, message: "Fetching Google Trends data...", time: 10000 },
  { progress: 25, message: "Processing market trends... Building comprehensive view of brand presence", time: 10000 },
  { progress: 35, message: "Analyzing search patterns... This helps understand market positioning", time: 10000 },
  { progress: 45, message: "Gathering competitive insights...", time: 10000 },
  // Sentiment analysis (about 30% of time)
  { progress: 60, message: "Starting AI sentiment analysis...", time: 5000 },
  { progress: 75, message: "Processing brand perception data...", time: 5000 },
  { progress: 85, message: "Analyzing market sentiment...", time: 5000 },
  { progress: 95, message: "Compiling final insights...", time: 2000 }
];

export default function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(loadingSteps[0].message);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setMessage(loadingSteps[0].message);
      setCurrentStepIndex(0);

      const updateStep = (index: number) => {
        if (index < loadingSteps.length) {
          setProgress(loadingSteps[index].progress);
          setMessage(loadingSteps[index].message);
          setCurrentStepIndex(index);
        }
      };

      // Schedule updates based on cumulative times
      loadingSteps.forEach((step, index) => {
        const cumulativeTime = loadingSteps
          .slice(0, index)
          .reduce((sum, s) => sum + s.time, 0);
        
        setTimeout(() => updateStep(index), cumulativeTime);
      });

      // Ensure we don't hang indefinitely
      const totalTime = loadingSteps.reduce((sum, step) => sum + step.time, 0);
      const timeout = setTimeout(() => {
        setProgress(100);
        setMessage("Analysis complete!");
      }, totalTime + 2000); // Add 2s buffer

      return () => {
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
        {currentStepIndex >= 1 && currentStepIndex <= 4 && (
          <div className="text-xs mt-1 text-amber-600 dark:text-amber-400">
            {Math.round((45 - (currentStepIndex * 10))) } seconds remaining...
          </div>
        )}
      </div>
    </div>
  );
} 