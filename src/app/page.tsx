"use client";

import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHover, useFloating, offset, shift, useInteractions, FloatingPortal } from '@floating-ui/react';
import ThemeToggle from '@/components/ThemeToggle';
import { HealthData } from '@/app/types/api'; // Import HealthData type
import BrandSurvey from '@/app/components/BrandSurvey';
import { HiSparkles } from 'react-icons/hi';
import { BiLoaderAlt } from 'react-icons/bi';
import Header from '@/components/Header';
import { useTheme } from 'next-themes';
import LoadingBar from '@/components/LoadingBar';
import SentimentVisuals from '@/components/SentimentVisuals';

// import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

function CustomTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), shift()],
    placement: 'top'
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-gray-900 text-white dark:bg-gray-100 dark:text-black p-2 rounded text-sm"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default function BrandHealth() {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthData, setHealthData] = useState<HealthData | null>(null); // Initialize with HealthData type
  const [scrapedData, setScrapedData] = useState<any>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [surveyEnabled, setSurveyEnabled] = useState(false);
  const [surveyScore, setSurveyScore] = useState<number | null>(null);

  const onScoreUpdate = (score: number) => {
    setSurveyScore(score);
  };

  const [brandTerm, setBrandTerm] = useState<string>('');

  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const formatTermAsUrl = (input: string): string => {
    const urlPattern = /^(http:\/\/|https:\/\/)/;
    if (!urlPattern.test(input)) {
      return `https://${input}`;
    }
    return input;
  };

  const extractBrandFromUrl = (url: string, scrapedData: any): string => {
    // First try to get a clean brand name from scraped data
    if (scrapedData?.title) {
      // Get the first few words of the title before common separators
      const titleParts = scrapedData.title.split(/[|\-–—]/)[0].trim();
      // Remove common company suffixes and clean up
      return titleParts.replace(/(Inc\.|LLC|Ltd\.|Corporation|Corp\.|Company|Co\.).*$/i, '').trim();
    }
    
    // Fallback to domain extraction
    try {
      const domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
                       .split('/')[0]  // Get domain part
                       .split('.')[0]; // Get first part of domain
      return domain;
    } catch (error) {
      console.error('URL parsing error:', error);
      return url;
    }
  };

  const isUrl = (input: string): boolean => {
    try {
      const urlPattern = /^(http:\/\/|https:\/\/)?[\w.-]+\.[a-zA-Z]{2,}(\/\S*)?$/;
      return urlPattern.test(input);
    } catch {
      return false;
    }
  };
  
  const handleSearch = async () => {
    setLoading(true);
    setError('');
  
    try {
      // First get the brand health data
      const healthResponse = await fetch('/api/brand-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ term: term }),
      });

      if (!healthResponse.ok) {
        throw new Error('Failed to fetch health data');
      }

      const healthData = await healthResponse.json();

      // Then get sentiment data with context from health data
      const sentimentResponse = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: term,
          context: {
            wiki: healthData?.data?.wiki?.extract,
            news: healthData?.data?.news?.articles?.map((article: { title: string }) => article.title).join('. '),
            description: healthData?.data?.ddg?.AbstractText
          }
        }),
      });

      if (!sentimentResponse.ok) {
        throw new Error('Failed to fetch sentiment data');
      }

      const sentimentData = await sentimentResponse.json();

      // Combine the data
      const combinedData = {
        ...healthData,
        data: {
          ...healthData.data,
          sentiment: sentimentData.sentiment
        }
      };

      console.log('Combined Data:', combinedData);
      setHealthData(combinedData);

    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  
  
  
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const calculateOverallScore = (data: HealthData) => {
    const baseScore = data.scores.overall;
    const sentimentScore = data.scores.sentiment || 50; // Assume neutral if missing
    if (!surveyEnabled || surveyScore === null) return baseScore;

    // Adjust these weights
    const SURVEY_WEIGHT = 0.15; // 15% weight to manual survey
    const SENTIMENT_WEIGHT = 0.10; // 10% weight to sentiment analysis
    const API_WEIGHT = 0.75; // 75% weight to API data

    return baseScore * API_WEIGHT + surveyScore * SURVEY_WEIGHT + sentimentScore * SENTIMENT_WEIGHT;
  };  

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <Header />

        <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Enter brand name, term, or URL"
            className="w-full p-2 border rounded text-black bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <BiLoaderAlt className="animate-spin h-5 w-5" />
                Analyzing...
              </>
            ) : (
              <>
                <HiSparkles className="h-5 w-5" />
                Analyze
              </>
            )}
          </button>
        </form>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div>
          <LoadingBar isLoading={loading} />
        </div>

        {healthData && (
          <div className="space-y-8 mt-0">
            <div className="block">
             {/*  <label className="text-gray-700 dark:text-gray-300">
                Enable Survey
              </label> */}
              <button
                onClick={() => setSurveyEnabled(!surveyEnabled)}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                  ${surveyEnabled 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <span className={`text-sm font-medium ${surveyEnabled ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {surveyEnabled ? 'Manual Survey Enabled' : 'Include Manual Survey'}
                </span>
                <div className={`
                  w-11 h-6 flex items-center rounded-full p-1
                  ${surveyEnabled ? 'bg-blue-300' : 'bg-gray-300 dark:bg-gray-800'}
                `}>
                  <div className={`
                    bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200
                    ${surveyEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `}></div>
                </div>
              </button>
            </div>

           

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Overall Score - 1/3 column */}
              <div>
                <div className="w-48 h-auto mx-auto">
                  <CircularProgressbar
                    value={calculateOverallScore(healthData)}
                    text={`${Math.round(calculateOverallScore(healthData))}%`}
                    styles={buildStyles({
                      pathColor: darkMode 
                        ? `rgba(147, 197, 253, ${calculateOverallScore(healthData) / 100})` // Light blue in dark mode
                        : `rgba(79, 70, 229, ${calculateOverallScore(healthData) / 100})`,  // Original color in light mode
                      textColor: darkMode ? '#FFFFFF' : '#1F2937',
                      trailColor: darkMode ? '#374151' : '#E5E7EB'
                    })}
                  />
                  <p className="text-center mt-2 dark:text-white font-semibold">Overall Score</p>
                </div>
              </div>

              {/* Component Scores - 2/3 column */}
              <div className="md:col-span-2">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Component Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomTooltip content="Based on Google Trends data">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      🔍 Search Trends: {healthData.scores.searchTrend}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  <CustomTooltip content="Based on Wikipedia page presence">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      📚 Wikipedia: {healthData.scores.wikipedia}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  <CustomTooltip content="Based on DuckDuckGo results">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      🌐 Search Results: {healthData.scores.searchResults}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  <CustomTooltip content="Based on recent news coverage">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      📰 News Coverage: {healthData.scores.newsCoverage}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  <CustomTooltip content="Based on Wikidata presence">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      🔖 Wikidata: {healthData.scores.wikidata}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  <CustomTooltip content="Based on Google search presence">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      🔍 Google Presence: {healthData.scores.googlePresence}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  <CustomTooltip content="Based on AI analysis of brand sentiment across news, social media, and market data">
                    <p className="flex items-center text-gray-700 dark:text-gray-300">
                      🤖 AI Sentiment: {healthData.data.sentiment.overallSentiment}%
                      <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                    </p>
                  </CustomTooltip>

                  {surveyEnabled && (
                    <CustomTooltip content="Based on manual brand assessment responses">
                      <p className="flex items-center text-gray-700 dark:text-gray-300">
                        📊 Survey Data: {Math.round(surveyScore ?? 0)}%
                        <span className="ml-2 text-gray-400 cursor-help text-sm">ⓘ</span>
                      </p>
                    </CustomTooltip>
                  )}
                </div>
              </div>
            </div>

            {/* Sentiment Analysis Section */}
            {healthData?.data?.sentiment && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <HiSparkles className="text-blue-500 mr-2" />
                  AI Brand Sentiment Analysis
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Overall Score */}
                  <div>
                  <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                          {Math.round(healthData.data.sentiment.overallSentiment)}%
                        </div>
                        <div className="w-full max-w-[200px] h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500 ease-out rounded-full"
                            style={{
                              width: `${healthData.data.sentiment.overallSentiment}%`,
                              backgroundColor: darkMode 
                                ? `rgba(147, 197, 253, ${healthData.data.sentiment.overallSentiment / 100})` 
                                : `rgba(79, 70, 229, ${healthData.data.sentiment.overallSentiment / 100})`
                            }}
                          />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          AI Sentiment Score
                        </div>
                      </div>

                    {/* Social Media Metrics */}
                    <div className="mt-6 space-y-4">
                      {/* Platform Metrics Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Twitter Card */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Twitter Mentions
                            {healthData.data.sentiment.socialMetrics?.twitter?.trend && (
                              <span className={`ml-2 ${healthData.data.sentiment.socialMetrics.twitter.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {healthData.data.sentiment.socialMetrics.twitter.trend === 'up' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {healthData.data.sentiment.socialMetrics?.twitter?.total?.toLocaleString()}
                          </div>
                          <div className="h-16">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={healthData.data.sentiment.socialMetrics?.twitter?.daily.map((value, index) => ({
                                  name: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index],
                                  value: value
                                }))}
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                              >
                                <Bar dataKey="value" fill="#1DA1F2" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</div>
                        </div>

                        {/* LinkedIn Card */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            LinkedIn Mentions
                            {healthData.data.sentiment.socialMetrics?.linkedin?.trend && (
                              <span className={`ml-2 ${healthData.data.sentiment.socialMetrics.linkedin.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {healthData.data.sentiment.socialMetrics.linkedin.trend === 'up' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {healthData.data.sentiment.socialMetrics?.linkedin?.total?.toLocaleString()}
                          </div>
                          <div className="h-16">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={healthData.data.sentiment.socialMetrics?.linkedin?.daily.map((value, index) => ({
                                  name: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index],
                                  value: value
                                }))}
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                              >
                                <Bar dataKey="value" fill="#0A66C2" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</div>
                        </div>

                        {/* Facebook Card */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Facebook Mentions
                            {healthData.data.sentiment.socialMetrics?.facebook?.trend && (
                              <span className={`ml-2 ${healthData.data.sentiment.socialMetrics.facebook.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {healthData.data.sentiment.socialMetrics.facebook.trend === 'up' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {healthData.data.sentiment.socialMetrics?.facebook?.total?.toLocaleString()}
                          </div>
                          <div className="h-16">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={healthData.data.sentiment.socialMetrics?.facebook?.daily.map((value, index) => ({
                                  name: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index],
                                  value: value
                                }))}
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                              >
                                <Bar dataKey="value" fill="#1877F2" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</div>
                        </div>
                      </div>

                      {/* Total Mentions - Full Width Row */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Social Mentions</div>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                          {healthData.data.sentiment.socialMetrics?.totalMentions?.toLocaleString()}
                        </div>
                        <div className="h-16">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={healthData.data.sentiment.socialMetrics?.twitter?.daily.map((value, index) => ({
                                name: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index],
                                value: value + 
                                  (healthData.data.sentiment.socialMetrics?.linkedin?.daily[index] || 0) + 
                                  (healthData.data.sentiment.socialMetrics?.facebook?.daily[index] || 0)
                              }))}
                              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                            >
                              <Bar dataKey="value" fill="#4F46E5" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Brand Analysis */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Brand Perception</h4>
                        <p className="text-gray-600 dark:text-gray-300">{healthData.data.sentiment.brandPerception}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Market Position</h4>
                        <p className="text-gray-600 dark:text-gray-300">{healthData.data.sentiment.marketPosition}</p>
                      </div>
                    </div>

                    {/* Social Insights */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Social Media Insights</h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{healthData.data.sentiment.socialInsight}</p>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Brand Reach</h4>
                      <p className="text-gray-600 dark:text-gray-300">{healthData.data.sentiment.brandReach}</p>
                    </div>

                    {/* Strengths and Concerns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Key Strengths</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {healthData.data.sentiment.keyStrengths.map((strength, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300">{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Areas of Attention</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {healthData.data.sentiment.potentialConcerns.map((concern, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300">{concern}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {/* Competitors Section */}
                    {healthData.data.sentiment.competitors && healthData.data.sentiment.competitors.length > 0 && (
                      <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Key Competitors</h5>
                        <div className="space-y-3">
                          {healthData.data.sentiment.competitors.map((competitor, index) => (
                            <div key={index} className="border-b border-blue-100 dark:border-blue-800 last:border-0 pb-2 last:pb-0">
                              <div className="flex items-center gap-2">
                                <h6 className="font-medium text-gray-900 dark:text-white">{competitor.name}</h6>
                                <span className="text-sm px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                  {competitor.type}
                                </span>
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                  competitor.sentiment === 'higher' ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100' :
                                  competitor.sentiment === 'lower' ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' :
                                  'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                                }`}>
                                  {competitor.sentiment} sentiment
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{competitor.description}</p>
                              {competitor.marketShare && competitor.marketShare !== 'unknown' && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Market Share: {competitor.marketShare}
                                </p>
                              )}
                              {competitor.strengths && competitor.strengths.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Key Strengths: </span>
                                  <ul className="list-disc list-inside">
                                    {competitor.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 ml-2">{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Debug Information */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <details className="text-sm">
                    <summary className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                      View Raw Sentiment Data
                    </summary>
                    <pre className="mt-2 bg-gray-50 dark:bg-gray-700 p-4 rounded overflow-auto">
                      {JSON.stringify(healthData.data.sentiment, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {/* Website Data Section */}
            {scrapedData && (
              <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="text-black dark:text-white space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {scrapedData?.metaImage ? (
    <img 
      src={scrapedData.metaImage} 
      alt="Site Preview"
      className="max-w-full h-auto rounded-lg shadow"
      onError={(e) => e.currentTarget.style.display = 'none'} 
    />
  ) : (
    <p>No image available.</p>
  )}
                    <div className="md:col-span-3">
                    <h2>Website Data</h2>
  <p><strong>Title:</strong> {scrapedData?.ogTitle || 'N/A'}</p>
  <p><strong>Description:</strong> {scrapedData?.ogDescription || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Survey Section */}
            <BrandSurvey 
              onScoreUpdate={onScoreUpdate} 
              isEnabled={surveyEnabled} 
              brandName={brandTerm} 
            />


            {/* Google Trends Chart */}
            {healthData?.data?.trends?.default?.timelineData && 
             healthData.data.trends.default.timelineData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
                  🔍 Google Trends - Search Interest Over Time
                </h3>
                <div className="h-[400px]">
                  <ResponsiveContainer>
                    <LineChart data={healthData.data.trends.default.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis
                        dataKey="formattedAxisTime"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: darkMode ? '#9CA3AF' : '#374151' }}
                      />
                      <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#374151' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '0.375rem',
                          color: darkMode ? '#FFFFFF' : '#000000',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value[0]"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={{ fill: '#4F46E5' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Brand Health Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
                📊 Brand Health Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { subject: 'Overall Health', score: healthData.scores.overall, color: '#4F46E5' },
                  { subject: 'Search Trends', score: healthData.scores.searchTrend, color: '#10B981' },
                  { subject: 'Wikipedia', score: healthData.scores.wikipedia, color: '#F59E0B' },
                  { subject: 'Search Results', score: healthData.scores.searchResults, color: '#EC4899' },
                  { subject: 'News Coverage', score: healthData.scores.newsCoverage, color: '#6366F1' },
                  { subject: 'Wikidata', score: healthData.scores.wikidata, color: '#8B5CF6' },
                  { subject: 'AI Sentiment', score: healthData.data.sentiment.overallSentiment, color: '#8B5CF6' },                  { subject: 'Google Presence', score: healthData.scores.googlePresence, color: '#2563EB' },
                  ...(surveyEnabled && surveyScore !== null ? [
                    { subject: 'Survey Score', score: Math.round(surveyScore), color: '#DC2626' }
                  ] : [])
                ].map((metric) => (
                  <div key={metric.subject} className="text-center">
                    <div className="w-32 h-32 mx-auto">
                      <CircularProgressbar
                        value={metric.score}
                        text={`${metric.score}%`}
                        styles={buildStyles({
                          pathColor: metric.color,
                          textColor: darkMode ? '#FFFFFF' : '#1F2937',
                          trailColor: darkMode ? '#374151' : '#E5E7EB'
                        })}
                      />
                    </div>
                    <p className="mt-2 font-medium text-gray-900 dark:text-white">{metric.subject}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wikipedia Information */}
            {healthData.data.wiki && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
                  📚 Wikipedia Information
                </h3>
                <div className="text-gray-600 dark:text-gray-300">
                  {healthData.data.wiki.extract || 'No Wikipedia information available.'}
                </div>
              </div>
            )}

            {/* DuckDuckGo Results */}
            {healthData.data.ddg && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
                  🌐 DuckDuckGo Search Results
                </h3>
                <div className="text-gray-600 dark:text-gray-300">
                  {healthData.data.ddg.abstract ? (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                      <p>{healthData.data.ddg.abstract}</p>
                      {healthData.data.ddg.AbstractURL && (
                        <a
                          href={healthData.data.ddg.AbstractURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 mt-2 inline-block"
                        >
                          Read more →
                        </a>
                      )}
                    </div>
                  ) : (
                    <p>No significant search results found.</p>
                  )}
                </div>
                {healthData.data.ddg?.RelatedTopics && 
                 healthData.data.ddg.RelatedTopics.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Related Topics</h4>
                    <ul className="space-y-3">
                      {healthData.data.ddg.RelatedTopics.slice(0, 5).map((topic, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-300">
                          <div className="flex items-start space-x-3">
                            {topic.Icon?.URL && (
                              <img
                                src={topic.Icon.URL}
                                alt=""
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <div>
                              <p>{topic.Text}</p>
                              {topic.FirstURL && (
                                <a
                                  href={topic.FirstURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 text-sm mt-1 inline-block"
                                >
                                  Learn more →
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* News Coverage Section */}
            {healthData?.data?.news?.articles && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
                  📰 Recent News Coverage
                </h3>
                <div className="space-y-4">
                  {healthData.data.news.articles.slice(0, 5).map((article, index) => (
                    <div key={index} className="border-b dark:border-gray-700 last:border-0 pb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {article.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-sm"
                        >
                          Read more →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wikidata Section */}
            {healthData.data.wikidata && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
                  🔖 Wikidata Information
                </h3>
                <div className="text-gray-600 dark:text-gray-300">
                  {healthData.data.wikidata.description ? (
                    <div>
                      <p className="mb-2"><strong>Description:</strong> {healthData.data.wikidata.description}</p>
                      {healthData.data.wikidata.aliases && (
                        <p><strong>Also known as:</strong> {healthData.data.wikidata.aliases.join(', ')}</p>
                      )}
                    </div>
                  ) : (
                    <p>No detailed Wikidata information available.</p>
                  )}
                </div>
              </div>
            )}

            {/* Data Sources Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">📊 Data Sources Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Google Trends</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Active search interest detected ({healthData.scores.searchTrend}%)
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Wikipedia</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {healthData.data.wiki ? 'Dedicated page exists' : 'No Wikipedia page found'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-semibold text-gray-900 dark:text-white">DuckDuckGo</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {healthData.scores.searchResults > 0 ? 'Search presence detected' : 'No significant results'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-semibold text-gray-900 dark:text-white">News Coverage</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {healthData.data.news?.articles?.length || 0} articles found
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Wikidata</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {healthData.data.wikidata ? 'Entity found' : 'No entity found'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Results Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                🔍 Top Search Results
              </h3>
              
              {/* Google Results */}
              {healthData.data?.google?.items?.[0] && (
                <div className="mb-6">
                  <h4 className="font-semibold dark:text-white mb-2">Google Top Result:</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="font-medium dark:text-white">{healthData.data.google.items[0].title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {healthData.data.google.items[0].snippet}
                    </p>
                    <a href={healthData.data.google.items[0].link} 
                       className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2 inline-block"
                       target="_blank"
                       rel="noopener noreferrer">
                      Visit Site →
                    </a>
                  </div>
                </div>
              )}

              

              {/* Raw Scores - Optional, could be hidden behind a "Debug" button */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <details>
                  <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                    Show Score Details
                  </summary>
                  <pre className="mt-2 bg-gray-50 dark:bg-gray-700 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(healthData.scores, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
