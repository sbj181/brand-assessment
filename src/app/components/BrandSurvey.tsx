import React, { useState } from 'react';

export interface SurveyQuestion {
  id: number;
  category: string;
  question: string;
  type: 'scale' | 'open' | 'multiSelect';
  options?: {
    text: string;
    weight: number;
  }[];
  weight: number; // importance multiplier for this question
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // Market Presence Category
  {
    id: 1,
    category: 'Market Presence',
    question: "How familiar are potential customers with this brand?",
    type: 'scale',
    options: [
      { text: "Not Familiar", weight: 1 },
      { text: "Somewhat Familiar", weight: 2 },
      { text: "Very Familiar", weight: 3 },
    ],
    weight: 1.5
  },
  {
    id: 2,
    category: 'Brand Reputation',
    question: "How loyal is the customer base of this brand?",
    type: 'scale',
    options: [
      { text: "Not Loyal", weight: 1 },
      { text: "Somewhat Loyal", weight: 2 },
      { text: "Very Loyal", weight: 3 },
    ],
    weight: 1.2
  },
  {
    id: 3,
    category: 'Brand Integration',
    question: "How well does the brand's values and mission align with your company's?",
    type: 'scale',
    options: [
      { text: "Not Aligned", weight: 1 },
      { text: "Somewhat Aligned", weight: 2 },
      { text: "Very Well Aligned", weight: 3 },
    ],
    weight: 1.3
  },
  {
    id: 4,
    category: 'Brand Strength',
    question: "How satisfied are customers with the products or services?",
    type: 'scale',
    options: [
      { text: "Not Satisfied", weight: 1 },
      { text: "Somewhat Satisfied", weight: 2 },
      { text: "Very Satisfied", weight: 3 },
    ],
    weight: 1.4
  }
];

interface BrandSurveyProps {
  onScoreUpdate: (score: number) => void;
  isEnabled: boolean;
}

export default function BrandSurvey({ onScoreUpdate, isEnabled }: BrandSurveyProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleAnswer = (questionId: number, weight: number) => {
    const newAnswers = { ...answers, [questionId]: weight };
    setAnswers(newAnswers);

    // Calculate weighted score
    let totalWeightedScore = 0;
    let totalPossibleWeightedScore = 0;

    SURVEY_QUESTIONS.forEach(question => {
      if (newAnswers[question.id]) {
        totalWeightedScore += newAnswers[question.id] * question.weight;
      }
      const maxWeight = Math.max(...(question.options?.map(opt => opt.weight) || [0]));
      totalPossibleWeightedScore += maxWeight * question.weight;
    });

    const percentageScore = (totalWeightedScore / totalPossibleWeightedScore) * 100;
    onScoreUpdate(percentageScore);
  };

  if (!isEnabled) return null;

  // Group questions by category
  const groupedQuestions = SURVEY_QUESTIONS.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, SurveyQuestion[]>);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="font-bold mb-6 text-gray-900 dark:text-white">
        📋 Brand Assessment Survey
      </h3>
      <div className="space-y-8">
        {Object.entries(groupedQuestions).map(([category, questions]) => (
          <div key={category} className="space-y-6">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
              {category}
            </h4>
            {questions.map((q) => (
              <div key={q.id} className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300">{q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {q.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(q.id, option.weight)}
                      className={`p-2 rounded transition-colors ${
                        answers[q.id] === option.weight
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 