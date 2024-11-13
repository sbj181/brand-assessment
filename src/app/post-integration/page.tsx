"use client";

import { useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Header from '@/components/Header';
import { useTheme } from 'next-themes';

const PostIntegrationSurvey = () => {
  const [score, setScore] = useState(0);
  const { theme } = useTheme();
  
  const [responses, setResponses] = useState({
    experience: 0,
    transition: 0,
    brandStrength: 0,
    additionalComments: '',
  });

  const weights = {
    experience: 0.4,
    transition: 0.3,
    brandStrength: 0.3,
  };

  const calculateScore = (updatedResponses = responses) => {
    let totalScore = 0;
    let maxPossibleScore = 0;

    Object.keys(weights).forEach((key) => {
      const responseValue = updatedResponses[key];
      const weight = weights[key];
      totalScore += responseValue * weight;
      maxPossibleScore += 9 * weight;
    });

    const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
    setScore(normalizedScore);
  };

  const handleRatingSelect = (question: string, rating: number) => {
    const updatedResponses = {
      ...responses,
      [question]: rating,
    };
    setResponses(updatedResponses);
    calculateScore(updatedResponses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Survey responses:', responses);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) {
      return theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(0, 200, 0)'; // Green
    } else if (score >= 40) {
      return theme === 'dark' ? 'rgb(234, 179, 8)' : 'rgb(255, 215, 0)'; // Yellow
    } else {
      return theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(255, 0, 0)'; // Red
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <Header />
        
        <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <div className="w-48 h-auto mx-auto mb-4">
            <CircularProgressbar
              value={score}
              text={`${score}%`}
              styles={buildStyles({
                pathColor: getScoreColor(score),
                textColor: theme === 'dark' ? '#FFFFFF' : '#1F2937',
                trailColor: theme === 'dark' ? '#374151' : '#E5E7EB',
              })}
            />
            <p className="text-center mt-2 text-gray-900 dark:text-white font-semibold">
              Overall Satisfaction Score
            </p>
          </div>

          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Post Integration Survey
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
          {[
          { name: 'experience', label: 'How was your experience migrating your brand to comply with the Aptar Group’s brand standards?' },
          { name: 'transition', label: 'How well was your brand’s transition to the Aptar Group’s brand standards handled by your colleagues within your organization?' },
          { name: 'brandStrength', label: 'Do you feel the transition to the Aptar Group’s family of brands has made your brand stronger?' },
        ].map((question, index) => (
              <div key={index} className="space-y-3">
                <label className="block text-md font-semibold text-gray-900 dark:text-white">
                  {question.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingSelect(question.name, rating)}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        responses[question.name] === rating
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-3">
              <label className="block text-md font-semibold text-gray-900 dark:text-white">
                We want to constantly improve how we work at the Aptar Group. How could we have made your brand's transition to our brand standards a better one?
              </label>
              <textarea
                name="additionalComments"
                value={responses.additionalComments}
                onChange={(e) => setResponses({ ...responses, additionalComments: e.target.value })}
                rows={4}
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                placeholder="Your feedback"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold"
            >
              Submit Survey
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostIntegrationSurvey;