import React, { useState } from 'react';

export interface SurveyQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    weight: number;
  }[];
}

interface BrandSurveyProps {
  onScoreUpdate: (score: number) => void;
  isEnabled: boolean;
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    question: "How would you rate this brand's market presence?",
    options: [
      { text: "Very weak", weight: 1 },
      { text: "Weak", weight: 2 },
      { text: "Strong", weight: 3 },
      { text: "Very strong", weight: 4 },
    ],
  },
  {
    id: 2,
    question: "How would you rate this brand's reputation?",
    options: [
      { text: "Poor", weight: 1 },
      { text: "Fair", weight: 2 },
      { text: "Good", weight: 3 },
      { text: "Excellent", weight: 4 },
    ],
  },
  // Add more questions as needed
];

export default function BrandSurvey({ onScoreUpdate, isEnabled }: BrandSurveyProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleAnswer = (questionId: number, weight: number) => {
    const newAnswers = { ...answers, [questionId]: weight };
    setAnswers(newAnswers);

    // Calculate and update score
    const totalPossibleScore = SURVEY_QUESTIONS.length * 4; // Max weight is 4
    const currentScore = Object.values(newAnswers).reduce((sum, weight) => sum + weight, 0);
    const percentageScore = (currentScore / totalPossibleScore) * 100;
    
    onScoreUpdate(percentageScore);
  };

  if (!isEnabled) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
        📋 Brand Survey
      </h3>
      <div className="space-y-6">
        {SURVEY_QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">{q.question}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {q.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(q.id, option.weight)}
                  className={`p-2 rounded ${
                    answers[q.id] === option.weight
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 