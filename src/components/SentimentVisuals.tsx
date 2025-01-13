import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface SentimentVisualsProps {
  sentiment: {
    overallSentiment: number;
    brandPerception: string;
    marketPosition: string;
    publicSentiment: string;
    keyStrengths: string[];
    potentialConcerns: string[];
  };
  theme?: string;
}

export default function SentimentVisuals({ sentiment, theme = 'light' }: SentimentVisualsProps) {
  // Prepare data for radar chart
  const radarData = [
    {
      metric: 'Brand Perception',
      value: sentiment.overallSentiment,
    },
    {
      metric: 'Market Position',
      value: sentiment.overallSentiment * 0.9, // Slightly adjust values for visual interest
    },
    {
      metric: 'Public Opinion',
      value: sentiment.overallSentiment * 0.95,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Section with Score and Radar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Circular Progress */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48">
            <CircularProgressbar
              value={sentiment.overallSentiment}
              text={`${sentiment.overallSentiment}%`}
              styles={buildStyles({
                pathColor: theme === 'dark' ? '#60A5FA' : '#3B82F6',
                textColor: theme === 'dark' ? '#fff' : '#1F2937',
                trailColor: theme === 'dark' ? '#374151' : '#E5E7EB',
              })}
            />
          </div>
          <h4 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Overall Brand Health
          </h4>
        </div>

        {/* Radar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: theme === 'dark' ? '#fff' : '#1F2937' }}
              />
              <PolarRadiusAxis stroke={theme === 'dark' ? '#4B5563' : '#9CA3AF'} />
              <Radar
                name="Brand Metrics"
                dataKey="value"
                stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
                fill={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Brand Analysis</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Perception</h5>
              <p className="mt-1 text-gray-900 dark:text-white">{sentiment.brandPerception}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Market Position</h5>
              <p className="mt-1 text-gray-900 dark:text-white">{sentiment.marketPosition}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Public Sentiment</h5>
              <p className="mt-1 text-gray-900 dark:text-white">{sentiment.publicSentiment}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Strengths */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {sentiment.keyStrengths.map((strength, index) => (
                <li key={index} className="text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Concerns */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="text-yellow-500 mr-2">!</span>
              Areas of Attention
            </h4>
            <ul className="space-y-2">
              {sentiment.potentialConcerns.map((concern, index) => (
                <li key={index} className="text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="text-yellow-500 mr-2">•</span>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 