"use client";

import { useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const PostIntegrationSurvey = () => {
  const [score, setScore] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

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

  // Function to determine the color from red (low score) to green (high score)
  const getScoreColor = (score) => {
    if (score >= 70) {
      return 'rgb(0, 200, 0)'; // Green for high scores
    } else if (score >= 40) {
      return 'rgb(255, 215, 0)'; // Yellow for moderate scores
    } else {
      return 'rgb(255, 0, 0)'; // Red for low scores
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
      <div className="w-48 h-auto mx-auto mb-4">
        <CircularProgressbar
          value={score}
          text={`${score}%`}
          styles={buildStyles({
            pathColor: getScoreColor(score),
            textColor: darkMode ? '#FFFFFF' : '#1F2937',
            trailColor: darkMode ? '#374151' : '#E5E7EB',
          })}
        />
        <p className="text-center mt-2 dark:text-white font-semibold">Overall Satisfaction Score</p>
      </div>

      <h1 className="text-2xl font-bold mb-4">Post Integration Survey</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: 'experience', label: 'How was your experience migrating your brand to comply with the Aptar Group’s brand standards?' },
          { name: 'transition', label: 'How well was your brand’s transition to the Aptar Group’s brand standards handled by your colleagues within your organization?' },
          { name: 'brandStrength', label: 'Do you feel the transition to the Aptar Group’s family of brands has made your brand stronger?' },
        ].map((question, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-md font-semibold">{question.label}</label>
            <div className="flex space-x-2">
              {Array.from({ length: 9 }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingSelect(question.name, rating)}
                  className={`px-3 py-1 border rounded ${
                    responses[question.name] === rating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  } hover:bg-blue-400 hover:text-white`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <label className="block text-md font-semibold">We want to constantly improve how we work at the Aptar Group. How could we have made your brand’s transition to our brand standards a better one?</label>
          <textarea
            name="additionalComments"
            value={responses.additionalComments}
            onChange={(e) => setResponses({ ...responses, additionalComments: e.target.value })}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Your feedback"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 mt-4"
        >
          Submit Survey
        </button>
      </form>
    </div>
  );
};

export default PostIntegrationSurvey;
