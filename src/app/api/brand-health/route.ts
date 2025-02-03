import { NextRequest, NextResponse } from 'next/server';
import { 
  TrendsData, 
  WikiData, 
  DuckDuckGoData, 
  NewsData, 
  WikidataResult, 
  Scores, 
  SentimentAnalysis
} from '@/app/types/api';

// Generic fetch wrapper with timeout
const fetchWithTimeout = async <T>(
  promise: () => Promise<T>,
  timeoutMs: number = 5000,
  apiName: string
): Promise<T | null> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${apiName} timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return await Promise.race([promise(), timeoutPromise]);
  } catch (error) {
    console.error(`${apiName} error:`, error);
    return null;
  }
};

interface TimelineDataPoint {
  timestamp: string;
  date: string;
  values: Array<{ extracted_value: number }>;
}

async function getTrendsData(term: string): Promise<TrendsData> {
  try {
    const url = `https://serpapi.com/search.json?engine=google_trends&data_type=TIMESERIES&q=${encodeURIComponent(term)}&api_key=${process.env.SERP_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SerpAPI returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.interest_over_time?.timeline_data) {
      throw new Error("No trends data available");
    }

    const timelineData = data.interest_over_time.timeline_data.map((point: any) => ({
      time: point.timestamp,
      formattedTime: point.date,
      value: [point.values[0].extracted_value]
    }));

    return {
      default: {
        timelineData
      }
    };
  } catch (error) {
    // Return empty timelineData with an error message
    return {
      default: {
        timelineData: [],
        errorMessage: `Failed to fetch trends data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };
  }
}

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet?: string;
}

interface GoogleSearchScore {
  score: number;
  totalResults: number;
  exactMatches: number;
  authorityScore: number;
  items?: GoogleSearchItem[];
}

const fetchGoogleResults = async (query: string): Promise<GoogleSearchScore> => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !cx) {
      throw new Error('Missing Google API credentials');
    }

    const cleanQuery = query.trim().replace(/,+$/, '');
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(cleanQuery)}&key=${apiKey}&cx=${cx}&num=10`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Google Search API request failed');
    }

    const data = await response.json();
    
    const authorityDomains = [
      '.gov', '.edu', '.org', 
      'wikipedia.org', 'linkedin.com', 
      'bloomberg.com', 'reuters.com'
    ];

    let exactMatches = 0;
    let authorityScore = 0;

    data.items?.forEach((item: GoogleSearchItem) => {
      if (item.title.toLowerCase().includes(query.toLowerCase()) || 
          item.snippet?.toLowerCase().includes(query.toLowerCase())) {
        exactMatches++;
      }

      if (authorityDomains.some(domain => item.link.includes(domain))) {
        authorityScore += 10;
      }

      if (item.link.includes(query.toLowerCase())) {
        authorityScore += 20;
      }
    });

    const score = Math.min(100, Math.round(
      (exactMatches * 10) + 
      authorityScore + 
      (Number(data.searchInformation?.totalResults) > 1000 ? 20 : 0)
    ));

    return {
      score,
      totalResults: Number(data.searchInformation?.totalResults || 0),
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
    const cleanTerm = term.trim().replace(/,+$/, '');
    const exactTerm = `"${cleanTerm}"`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(exactTerm)}&apiKey=${process.env.NEWS_API_KEY}&language=en&sortBy=relevancy&pageSize=10`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('News API request failed');
    }

    return await response.json();
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
    if (!response.ok) throw new Error('Failed to fetch Wikidata');
    const data = await response.json();
    return data.search[0] || null;
  } catch (error) {
    console.error('Wikidata error:', error);
    return null;
  }
}

async function getWikipediaData(term: string): Promise<WikiData | null> {
  try {
    const searchTerm = `${term}_(company)`;
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    );
    
    if (!response.ok) {
      const fallbackResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
      );
      if (!fallbackResponse.ok) {
        throw new Error('Wikipedia API request failed');
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
      throw new Error('DuckDuckGo API request failed');
    }
    return await response.json();
  } catch (error) {
    console.error('DuckDuckGo error:', error);
    return null;
  }
}

interface SentimentContext {
  news: NewsData | null;
  wiki: WikiData | null;
  trends: TrendsData | null;
}

async function getSentimentAnalysis(term: string, context: SentimentContext) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not defined');
    }

    const response = await fetch(`${baseUrl}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, context }),
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Sentiment analysis failed: ${response.status}`);
    }

    const data = await response.json();
    return data.sentiment;
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    return null;
  }
}

function calculateScores(
  trendsData: TrendsData | null,
  wikiData: WikiData | null,
  ddgData: DuckDuckGoData | null,
  newsData: NewsData | null,
  wikidataData: WikidataResult | null,
  googleData: GoogleSearchScore | null,
  sentimentData: SentimentAnalysis | null
): Scores {
  // Calculate individual component scores
  const componentScores = {
    searchTrend: trendsData?.default?.timelineData?.length ?
      Math.round(trendsData.default.timelineData.reduce(
        (acc, point) => acc + (point.value?.[0] || 0), 0
      ) / trendsData.default.timelineData.length) : 0,
    wikipedia: Math.round(wikiData?.extract ? Math.min(100, wikiData.extract.length / 100) : 0),
    searchResults: Math.round(ddgData?.RelatedTopics?.length ? Math.min(100, ddgData.RelatedTopics.length * 10) : 0),
    newsCoverage: Math.round(newsData?.articles?.length ? Math.min(100, newsData.articles.length * 10) : 0),
    wikidata: wikidataData ? 80 : 0,
    googlePresence: googleData?.score || 0,
    sentiment: Math.round(sentimentData?.overallSentiment || 0)
  };

  // Calculate overall score
  const overall = Math.round(
    (
      componentScores.searchTrend +
      componentScores.wikipedia +
      componentScores.searchResults +
      componentScores.newsCoverage +
      componentScores.wikidata +
      componentScores.googlePresence +
      componentScores.sentiment
    ) / 7
  );

  return {
    ...componentScores,
    overall
  };
}

export async function POST(request: NextRequest) {
  try {
    const { term } = await request.json();
    if (!term) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing term parameter' 
      }, { status: 400 });
    }

    const [trendsData, wikiData, ddgData, newsData, wikidataData, googleData] = await Promise.all([
      fetchWithTimeout(() => getTrendsData(term), 45000, 'Google Trends'),
      fetchWithTimeout(() => getWikipediaData(term), 5000, 'Wikipedia'),
      fetchWithTimeout(() => getDuckDuckGoData(term), 5000, 'DuckDuckGo'),
      fetchWithTimeout(() => getNewsData(term), 5000, 'News API'),
      fetchWithTimeout(() => getWikidata(term), 5000, 'Wikidata'),
      fetchWithTimeout(() => fetchGoogleResults(term), 5000, 'Google Search')
    ]);

    const context = { news: newsData, wiki: wikiData, trends: trendsData };
    const sentimentData = await getSentimentAnalysis(term, context);
    
    // Pass sentimentData to calculateScores
    const scores = calculateScores(
      trendsData, 
      wikiData, 
      ddgData, 
      newsData, 
      wikidataData, 
      googleData,
      sentimentData
    );

    return NextResponse.json({
      success: true,
      scores,
      data: {
        searchTerm: term,
        trends: trendsData,
        wiki: wikiData,
        ddg: ddgData,
        news: newsData,
        wikidata: wikidataData,
        google: googleData,
        sentiment: sentimentData
      }
    });
  } catch (error) {
    console.error('Error in brand health API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}