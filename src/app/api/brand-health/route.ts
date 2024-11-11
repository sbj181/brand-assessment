import { NextRequest, NextResponse } from 'next/server';
import { interestOverTime } from 'google-trends-api';
import { TrendsData, WikiData, DuckDuckGoData, NewsData, WikidataResult, Scores } from '@/app/types/api';


async function getTrendsData(term: string): Promise<TrendsData | null> {
    try {
    const result = await interestOverTime({
      keyword: term,
      startTime: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)), // 1 year ago
      endTime: new Date()
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('Google Trends error:', error);
    return null;
  }
}

interface GoogleSearchScore {
  score: number;
  totalResults: number;
  exactMatches: number;
  authorityScore: number;
}

const fetchGoogleResults = async (query: string): Promise<GoogleSearchScore> => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;
    
    // Clean the query and add brand-specific terms
    const cleanQuery = query.trim().replace(/,+$/, '');

    // Add exclusions for residential/real estate terms when the query contains "home"
    const exclusions = cleanQuery.toLowerCase().includes('home') ? 
    '-real -estate -apartment -house -residential -zillow -redfin -trulia' : '';

    // Add search operators to focus on company/brand results
    const enhancedQuery = `"${cleanQuery}" (company OR brand OR business OR corporation OR enterprise) ${exclusions}`;
    
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(enhancedQuery)}&key=${apiKey}&cx=${cx}&num=10`;
    
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
      // Check for exact matches in title or snippet
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const snippetMatch = item.snippet?.toLowerCase().includes(query.toLowerCase());
      if (titleMatch || snippetMatch) exactMatches++;

      // Check for authority domains
      if (authorityDomains.some(domain => item.link.includes(domain))) {
        authorityScore += 10;
      }

      // Additional points for official website
      if (item.link.includes(query.toLowerCase())) {
        authorityScore += 20;
      }
    });

    // Calculate final score (0-100)
    const score = Math.min(100, Math.round(
      (exactMatches * 10) +  // Up to 100 points for exact matches
      (authorityScore) +     // Points for authority sites
      (data.searchInformation?.totalResults > 1000 ? 20 : 0)  // Bonus for high total results
    ));

    return {
      score,
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      exactMatches,
      authorityScore
    };
  } catch (error) {
    console.error('Google Search API error:', error);
    return {
      score: 0,
      totalResults: 0,
      exactMatches: 0,
      authorityScore: 0
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
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
      );
      if (!response.ok) {
        console.error('Wikipedia API error:', await response.text());
        return null;
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
  
  

  export async function POST(request: NextRequest) {
    try {
      const { term } = await request.json();
      console.log('Searching for term:', term);
      console.log('NEWS_API_KEY exists:', !!process.env.NEWS_API_KEY);
  
      // Fetch data from all sources concurrently
      const [trendsData, wikiData, ddgData, newsData, wikidataData, googleData] = await Promise.all([
        getTrendsData(term),
        getWikipediaData(term),
        getDuckDuckGoData(term),
        getNewsData(term),
        getWikidata(term),
        fetchGoogleResults(term)
      ]);
  
      console.log('News Data received:', newsData); // Debug log
  
      const scores = calculateScores(trendsData, wikiData, ddgData, newsData, wikidataData, googleData);
      console.log('Calculated scores:', scores); // Debug log
  
      return new NextResponse(
        JSON.stringify({
          success: true,
          scores,
          data: {
            trends: trendsData,
            wiki: wikiData,
            ddg: ddgData,
            news: newsData,
            wikidata: wikidataData,
            term
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
    } catch (error) {
      console.error('API route error:', error);
  
      return new NextResponse(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
  
  