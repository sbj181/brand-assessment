"use client";

import React, { useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHover, useFloating, offset, shift, useInteractions, FloatingPortal } from '@floating-ui/react';
import ThemeToggle from '@/components/ThemeToggle';
import { HealthData } from '@/app/types/api'; // Import HealthData type

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
            className="bg-gray-900 text-white p-2 rounded text-sm"
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
  const [darkMode, setDarkMode] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/brand-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ term })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'An error occurred');
      }
      
      // Type assertion to ensure data matches HealthData
      setHealthData(data as HealthData); // Assert that data is of type HealthData
    } catch (err: any) {
      console.error('Search error:', err);
      setError(typeof err === 'string' ? err : err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brand Health Assessment</h1>
          <ThemeToggle />
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Enter brand name, term, or URL"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}

        {healthData && (
          <div className="space-y-8 mt-8">
            {/* Scores Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CircularProgressbar */}
              <div className="w-48 h-48 mx-auto">
                <CircularProgressbar
                  value={healthData.scores.overall}
                  text={`${healthData.scores.overall}%`}
                  styles={buildStyles({
                    pathColor: `rgba(79, 70, 229, ${healthData.scores.overall / 100})`,
                    textColor: darkMode ? '#FFFFFF' : '#1F2937',
                    trailColor: darkMode ? '#374151' : '#E5E7EB'
                  })}
                />
                <p className="text-center mt-2 font-semibold">Overall Score</p>
              </div>

              {/* Component Scores */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Component Scores</h3>
                <div className="space-y-3">
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
                </div>
              </div>
            </div>

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
          </div>
        )}
      </div>
    </div>
  );
}
