"use client";

import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Header from '@/components/Header';
import { useTheme } from 'next-themes';
import { XBHIResponses, XBHIWeights } from '@/app/types/survey';

type XBHIKey = keyof Omit<XBHIResponses, 'additionalFeedback'>;

interface SurveyQuestion {
  name: XBHIKey;
  label: string;
}

const XBHISurvey = () => {
  const [brandName, setBrandName] = useState('');
  const [score, setScore] = useState(0);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [responses, setResponses] = useState<XBHIResponses>({
    recognition: 0,
    trust: 0,
    relevance: 0,
    recommendation: 0,
    reputation: 0,
    innovation: 0,
    resonance: 0,
    satisfaction: 0,
    delivery: 0,
    additionalFeedback: ''
  });

  const weights: XBHIWeights = {
    recognition: 0.1,
    trust: 0.2,
    relevance: 0.1,
    recommendation: 0.2,
    reputation: 0.1,
    innovation: 0.1,
    resonance: 0.05,
    satisfaction: 0.1,
    delivery: 0.15,
  };

  const calculateScore = (updatedResponses: XBHIResponses = responses) => {
    let totalScore = 0;
    let maxPossibleScore = 0;

    (Object.keys(weights) as XBHIKey[]).forEach((key) => {
      const responseValue = updatedResponses[key];
      const weight = weights[key];
      totalScore += responseValue * weight;
      maxPossibleScore += 10 * weight;
    });

    const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
    setScore(normalizedScore);
  };

  const handleRatingSelect = (question: XBHIKey, rating: number) => {
    const updatedResponses = {
      ...responses,
      [question]: rating,
    };
    setResponses(updatedResponses);
    calculateScore(updatedResponses);
  };

  const questions: SurveyQuestion[] = [
    { 
      name: 'recognition', 
      label: `How well do you recognize ${brandName} compared to others in the industry?` 
    },
    { 
      name: 'trust', 
      label: `How would you rate your level of trust in ${brandName} products/services?` 
    },
    { 
      name: 'relevance', 
      label: `How relevant do you feel ${brandName} is to your needs and preferences?` 
    },
    { 
      name: 'recommendation', 
      label: `How likely are you to recommend ${brandName} to others?` 
    },
    { 
      name: 'reputation', 
      label: `How would you rate ${brandName}'s reputation compared to its competitors?` 
    },
    { 
      name: 'innovation', 
      label: `How innovative do you perceive ${brandName} to be?` 
    },
    { 
      name: 'resonance', 
      label: `How well does ${brandName}'s messaging resonate with you?` 
    },
    { 
      name: 'satisfaction', 
      label: `How do you feel about your overall experience with ${brandName}?` 
    },
    { 
      name: 'delivery', 
      label: `How well does ${brandName} deliver on its promises?` 
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

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
                pathColor: theme === 'dark'
                  ? `rgba(147, 197, 253, ${score / 100})`
                  : `rgba(79, 70, 229, ${score / 100})`,
                textColor: theme === 'dark' ? '#FFFFFF' : '#1F2937',
                trailColor: theme === 'dark' ? '#374151' : '#E5E7EB',
              })}
            />
            <p className="text-center mt-2 text-gray-900 dark:text-white font-semibold">
              Overall Score
            </p>
          </div>

          <h1 className="text-2xl font-bold mb-4">External Brand Health Indicator (XBHI) Survey</h1>

          <label htmlFor="brandName" className="block text-lg mb-2 font-semibold">
            Enter Brand Name
          </label>
          <input
            type="text"
            id="brandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Brand Name"
            className="w-full mb-6 p-2 border rounded"
          />

          <form className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-3">
                <label className="block text-md font-semibold text-gray-900 dark:text-white">
                  {question.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingSelect(question.name, rating)}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
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
              <label className="block text-md font-semibold">
                Is there anything else you'd like us to know about your experience with {brandName}?
              </label>
              <textarea
                name="additionalFeedback"
                value={responses.additionalFeedback}
                onChange={(e) => setResponses({ ...responses, additionalFeedback: e.target.value })}
                rows={4}
                className="w-full p-2 border rounded"
                placeholder="Your feedback"
              />
            </div>

            <button
              type="button"
              onClick={() => calculateScore()}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 mt-4"
            >
              Submit Survey
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default XBHISurvey;
