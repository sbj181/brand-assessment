import { NextRequest, NextResponse } from 'next/server';
import { TrendsData, WikiData, DuckDuckGoData, NewsData, WikidataResult, Scores } from '@/app/types/api';

const fetchWithTimeout = async <T>(
  promise: () => Promise<T>,
  timeoutMs: number = 5000,
  apiName: string
): Promise<T | null> => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${apiName} timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return await Promise.race([
      promise(),
      timeoutPromise
    ]) as T;
  } catch (error) {
    console.error(`${apiName} error:`, error);
    return null;
  }
};

async function getTrendsData(term: string): Promise<TrendsData | null> {
  try {
    console.log(`Fetching trends data for term: ${term}`);
    
    const url = `https://serpapi.com/search.json?engine=google_trends&data_type=TIMESERIES&q=${encodeURIComponent(term)}&api_key=${process.env.SERP_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SerpAPI returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.interest_over_time?.timeline_data) {
      throw new Error("No trends data available");
    }

    // Convert SerpAPI format to match our TrendsData type
    const timelineData = data.interest_over_time.timeline_data.map((point: any) => ({
      time: point.timestamp,
      formattedTime: point.date,
      value: [point.values[0].extracted_value]
    }));

    console.log('Successfully retrieved trends data:', {
      dataPoints: timelineData.length,
      sampleValue: timelineData[0]?.value
    });

    return {
      default: {
        timelineData
      }
    } as TrendsData;

  } catch (error: any) {
    console.error("SerpAPI Trends error:", error);
    return {
      default: {
        timelineData: [],
        error: `Failed to fetch trends data: ${error.message}`
      }
    } as TrendsData;
  }
}



interface GoogleSearchScore {
  score: number;
  totalResults: number;
  exactMatches: number;
  authorityScore: number;
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
}

const fetchGoogleResults = async (query: string): Promise<GoogleSearchScore> => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;
    
    // Clean the query to remove any trailing commas
    const cleanQuery = query.trim().replace(/,+$/, '');

    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(cleanQuery)}&key=${apiKey}&cx=${cx}&num=10`;

    console.log('Search URL:', url.replace(apiKey!, '[REDACTED]'));

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', errorText);
      throw new Error('Google Search API request failed');
    }

    const data = await response.json();
    console.log('Search results:', {
      totalResults: data.searchInformation?.totalResults,
      itemsCount: data.items?.length,
      firstResult: data.items?.[0]
    });

    // Initialize scoring variables
    let exactMatches = 0;
    let authorityScore = 0;
    const authorityDomains = [
      '.gov', '.edu', '.org', 
      'wikipedia.org', 'linkedin.com', 
      'bloomberg.com', 'reuters.com'
    ];

    // Analyze each result
    data.items?.forEach((item: any) => {
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const snippetMatch = item.snippet?.toLowerCase().includes(query.toLowerCase());
      if (titleMatch || snippetMatch) exactMatches++;

      if (authorityDomains.some(domain => item.link.includes(domain))) {
        authorityScore += 10;
      }

      if (item.link.includes(query.toLowerCase())) {
        authorityScore += 20;
      }
    });

    const score = Math.min(100, Math.round(
      (exactMatches * 10) + 
      (authorityScore) + 
      (data.searchInformation?.totalResults > 1000 ? 20 : 0)
    ));

    return {
      score,
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      exactMatches,
      authorityScore,
      items: data.items
    };
  } catch (error) {
    console.error('Google Search API error:', error);
    return {
      score: 0,
      totalResults: 0,
      exactMatches: 0,
      authorityScore: 0,
      items: []
    };
  }
};


async function getNewsData(term: string): Promise<NewsData | null> {
    try {
    console.log('Fetching news for term:', term);
    
    const cleanTerm = term.trim().replace(/,+$/, '');
    const exactTerm = `"${cleanTerm}"`;
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(exactTerm)}&apiKey=${process.env.NEWS_API_KEY}&language=en&sortBy=relevancy&pageSize=10`;
    
    console.log('News API URL:', url.replace(process.env.NEWS_API_KEY!, '[REDACTED]'));
    
    const response = await fetch(url);
    console.log('News API Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('News API Error:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('News API articles count:', data.articles?.length);
    return data;
  } catch (error) {
    console.error('NewsAPI error:', error);
    return null;
  }
}

async function getWikidata(term: string): Promise<WikidataResult | null> {
    try {
      const response = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&origin=*`
      );
      if (!response.ok) throw new Error('Failed to fetch Wikidata data');
      const data = await response.json();
      return data.search[0] || null; // Return the first result
    } catch (error) {
      console.error('Wikidata error:', error);
      return null;
    }
  }
  
  

  async function getWikipediaData(term: string): Promise<WikiData | null> {
    try {
      // Add generic company suffix to improve company-related matches
      const searchTerm = `${term}_(company)`;
      
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
      );
      
      // If company suffix fails, try the original term
      if (!response.ok) {
        const fallbackResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
        );
        if (!fallbackResponse.ok) {
          console.error('Wikipedia API error:', await fallbackResponse.text());
          return null;
        }
        return await fallbackResponse.json();
      }
      
      return await response.json();
    } catch (error) {
      console.error('Wikipedia error:', error);
      return null;
    }
  }
  
  async function getDuckDuckGoData(term: string): Promise<DuckDuckGoData | null> {
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(term)}&format=json&pretty=1`
      );
      if (!response.ok) {
        console.error('DuckDuckGo API error:', await response.text());
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('DuckDuckGo error:', error);
      return null;
    }
  }
  
  

  function calculateScores(
    trendsData: TrendsData | null,
    wikiData: WikiData | null,
    ddgData: DuckDuckGoData | null,
    newsData: NewsData | null,
    wikidataData: WikidataResult | null,
    googleData: GoogleSearchScore | null
  ): Scores {
    const trendScore = trendsData?.default?.timelineData?.length ? 
      trendsData.default.timelineData.reduce(
        (acc, point) => acc + (point.value[0] || 0), 0
      ) / trendsData.default.timelineData.length : 0; // Default to 0 if undefined
  
    const wikiScore = wikiData ? 
      (wikiData.extract ? Math.min(100, wikiData.extract.length / 100) : 0) : 0;
  
    const ddgScore = ddgData ? 
      (ddgData.RelatedTopics?.length ? Math.min(100, ddgData.RelatedTopics.length * 10) : 0) : 0;
  
    const newsScore = newsData?.articles?.length ? Math.min(100, newsData.articles.length * 10) : 0;
  
    const wikidataScore = wikidataData ? 80 : 0; // Assign a fixed score if Wikidata entry exists
  
    const googleScore = googleData ? Math.min(100, googleData.score) : 0;

    return {
      searchTrend: Math.round(trendScore) || 0,
      wikipedia: Math.round(wikiScore) || 0,
      searchResults: Math.round(ddgScore) || 0,
      newsCoverage: Math.round(newsScore) || 0,
      wikidata: wikidataScore,
      googlePresence: googleScore, // New score
      overall: Math.round(
        (trendScore + wikiScore + ddgScore + newsScore + wikidataScore + googleScore) / 6
      ) || 0
    };
  }
  
  

  async function getSentimentAnalysis(term: string, context: any) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL is not defined');
      }

      console.log('Making sentiment request to:', `${baseUrl}/api/sentiment`);

      const response = await fetch(`${baseUrl}/api/sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term,
          context: {
            news: context.news,
            wiki: context.wiki,
            trends: context.trends
          }
        }),
        // Add these options for server-side fetch
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch sentiment data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Sentiment Analysis Response:', data);
      return data.sentiment;
    } catch (error) {
      console.error('Error fetching sentiment:', error);
      return null;
    }
  }

  console.log("Incoming request for health data");

  export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const term = searchParams.get('term');
      
      if (!term) {
        return new Response('Missing term parameter', { status: 400 });
      }

      console.log(`Processing health check for term: ${term}`);

      // Fetch all your data...
      
      // Before generating sentiment
      console.log("Raw data collected, generating sentiment...");

      // Generate sentiment analysis
      const sentiment = await generateSentimentAnalysis(newsArticles, wikiData, trends);
      
      console.log("Sentiment generated:", sentiment);

      // Return response
      return new Response(JSON.stringify({
        trends,
        wiki: wikiData,
        ddg: ddgData,
        news: newsData,
        wikidata: wikidataData,
        google: googleData,
        sentiment, // Make sure this is included
        term
      }));

    } catch (error) {
      console.error("Error in health check:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  
  export async function POST(request: NextRequest) {
    try {
      const { term } = await request.json();
      console.log('Processing brand health for term:', term);

      // Collect all your data
      const [trendsData, wikiData, ddgData, newsData, wikidataData, googleData] = await Promise.all([
        fetchWithTimeout(() => getTrendsData(term), 5000, 'Google Trends'),
        fetchWithTimeout(() => getWikipediaData(term), 5000, 'Wikipedia'),
        fetchWithTimeout(() => getDuckDuckGoData(term), 5000, 'DuckDuckGo'),
        fetchWithTimeout(() => getNewsData(term), 5000, 'News API'),
        fetchWithTimeout(() => getWikidata(term), 5000, 'Wikidata'),
        fetchWithTimeout(() => fetchGoogleResults(term), 5000, 'Google Search')
      ]);

      // Create context for sentiment analysis
      const context = {
        news: newsData,
        wiki: wikiData,
        trends: trendsData
      };

      // Get sentiment analysis with context
      const sentimentData = await getSentimentAnalysis(term, context);
      console.log('Sentiment Data:', sentimentData);

      const scores = calculateScores(trendsData, wikiData, ddgData, newsData, wikidataData, googleData, sentimentData);
      
      return NextResponse.json({
        success: true,
        scores,
        data: {
          trends: trendsData,
          wiki: wikiData,
          ddg: ddgData,
          news: newsData,
          wikidata: wikidataData,
          google: googleData,
          sentiment: sentimentData?.sentiment || null,
          term
        }
      });

    } catch (error) {
      console.error('Error in brand health API:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
  }
  
  