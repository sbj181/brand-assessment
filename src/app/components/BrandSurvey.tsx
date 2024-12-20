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
  // Brand Consistency Category
  {
    id: 1,
    category: 'Brand Consistency',
    question: "How consistent is {brand name}'s presentation across its internal and external communications? (Is the logo used consistently? Are there clear similarities between communications in both look and tone?)",
    type: 'scale',
    options: [
      { text: "Not at all consistent", weight: 1 },
      { text: "Somewhat consistent", weight: 2 },
      { text: "Very consistent", weight: 3 },
    ],
    weight: 1.5
  },
  {
    id: 2,
    category: 'Brand Value Proposition',
    question: "Is the {brand name} value proposition clearly demonstrated through its owned media channels? (such as a website or social presence)",
    type: 'scale',
    options: [
      { text: "Not clear at all", weight: 1 },
      { text: "Somewhat clear", weight: 2 },
      { text: "Very clear", weight: 3 },
    ],
    weight: 1.4
  },
  {
    id: 3,
    category: 'Competitive Comparison',
    question: "Compared to its top competitors, what is your assessment of {brand name}'s overall presentation?",
    type: 'scale',
    options: [
      { text: "Not as strong", weight: 1 },
      { text: "Similar", weight: 2 },
      { text: "Very strong and differentiated", weight: 3 },
    ],
    weight: 1.6
  },
  {
    id: 4,
    category: 'Business Appeal',
    question: "Does {brand name} feel like one you would like to do business with?",
    type: 'scale',
    options: [
      { text: "No", weight: 1 },
      { text: "Maybe", weight: 2 },
      { text: "Yes", weight: 3 },
    ],
    weight: 1.5
  },
  {
    id: 5,
    category: 'Brand Similarity to Aptar',
    question: "Does {brand name} have any similarities to the current Aptar Group family of brands?",
    type: 'scale',
    options: [
      { text: "Not similar at all", weight: 1 },
      { text: "Somewhat similar", weight: 2 },
      { text: "Similar", weight: 3 },
    ],
    weight: 1.3
  }
];


interface BrandSurveyProps {
  onScoreUpdate: (score: number) => void;
  isEnabled: boolean;
  brandName: string; // prop for dynamic brand name
}


export default function BrandSurvey({ onScoreUpdate, isEnabled, brandName }: BrandSurveyProps) {
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
      <h3 className="font-bold text-xl mb-6 text-gray-900 dark:text-white">
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
                <p className="text-gray-700 dark:text-gray-300">
                  {q.question.replace('{brand name}', brandName)}
                </p>
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