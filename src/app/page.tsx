"use client";

import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHover, useFloating, offset, shift, useInteractions, FloatingPortal } from '@floating-ui/react';
import ThemeToggle from '@/components/ThemeToggle';
import { HealthData } from '@/app/types/api'; // Import HealthData type
import BrandSurvey from '@/app/components/BrandSurvey';
import { HiSparkles } from 'react-icons/hi';
import { BiLoaderAlt } from 'react-icons/bi';
import Header from '@/components/Header';
import { useTheme } from 'next-themes';
import LoadingBar from '@/components/LoadingBar';

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
    setScrapedData(null);
    setHealthData(null);
  
    const isInputUrl = isUrl(term);
    console.log('Is URL?', isInputUrl, term);
  
    // Set default value for `extractedBrandTerm` based on input term
    let extractedBrandTerm = term;
  
    try {
      if (isInputUrl) {
        console.log('Attempting to scrape URL:', term);
        // Only scrape if the input is a URL
        const scrapeResponse = await fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ url: formatTermAsUrl(term) }), // Ensure URL is properly formatted
        });
  
        console.log('Scrape response status:', scrapeResponse.status);
  
        if (scrapeResponse.ok) {
          const scrapeResult = await scrapeResponse.json();
          console.log('Scrape result:', scrapeResult);
          
          setScrapedData(scrapeResult.data);
          // Extract the brand term using renamed function
          extractedBrandTerm = extractBrandFromUrl(term, scrapeResult.data);
          console.log('Extracted brand term:', extractedBrandTerm);
        } else {
          const text = await scrapeResponse.text();
          console.error('Scrape error:', text);
          throw new Error(`Scraping failed: ${text}`);
        }
      }
  
      setBrandTerm(extractedBrandTerm); // Update brand term
  
      // Proceed with other data fetching steps (e.g., trends, news)
      const healthResponse = await fetch('/api/brand-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ term: extractedBrandTerm }),
      });
  
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthData(healthData as HealthData);
      } else {
        const text = await healthResponse.text();
        throw new Error(`Unexpected response from server: ${text}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(
        typeof err === 'string' 
          ? err 
          : err instanceof Error 
            ? err.message 
            : 'An error occurred'
      );
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
    if (!surveyEnabled || surveyScore === null) return baseScore;
    
    // Adjust these weights based on how much you want the survey to impact the score
    const SURVEY_WEIGHT = 0.2; // 20% weight to survey
    const API_WEIGHT = 0.8;    // 80% weight to API data
    
    return (baseScore * API_WEIGHT) + (surveyScore * SURVEY_WEIGHT);
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
          <div className="space-y-8 mt-8">
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

            

            {/* Website Data Section */}
            {scrapedData && (
              <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="text-black dark:text-white space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {scrapedData.metaImage && (
                      <div className="mb-4 md:mb-0">
                        <img 
                          src={scrapedData.metaImage} 
                          alt="Site Preview"
                          className="max-w-full h-auto rounded-lg shadow"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="md:col-span-3">
                      <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Website Data</h2>
                      <p><strong>Title:</strong> {scrapedData.ogTitle || 'N/A'}</p>
                      <p><strong>Description:</strong> {scrapedData.ogDescription || 'N/A'}</p>
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
                  { subject: 'Google Presence', score: healthData.scores.googlePresence, color: '#2563EB' },
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
