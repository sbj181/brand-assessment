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

async function getNewsData(term: string): Promise<NewsData | null> {
    try {
    console.log('Fetching news for term:', term);
    
    const url = `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(term)}` +
      `&apiKey=${process.env.NEWS_API_KEY}` +
      `&language=en` +
      `&sortBy=relevancy` +
      `&pageSize=10`;
    
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
      if (!response.ok && term.includes(' ')) {
        return await getWikipediaData('Bristol Myers Squibb');
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
      if (!response.ok && term.includes(' ')) {
        return await getDuckDuckGoData('Bristol Myers Squibb');
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
    wikidataData: WikidataResult | null
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
  
    return {
      searchTrend: Math.round(trendScore) || 0,
      wikipedia: Math.round(wikiScore) || 0,
      searchResults: Math.round(ddgScore) || 0,
      newsCoverage: Math.round(newsScore) || 0,
      wikidata: wikidataScore,
      overall: Math.round((trendScore + wikiScore + ddgScore + newsScore + wikidataScore) / 5) || 0
    };
  }
  
  

  export async function POST(request: NextRequest) {
    try {
      const { term } = await request.json();
      console.log('Searching for term:', term);
      console.log('NEWS_API_KEY exists:', !!process.env.NEWS_API_KEY);
  
      // Fetch data from all sources concurrently
      const [trendsData, wikiData, ddgData, newsData, wikidataData] = await Promise.all([
        getTrendsData(term),
        getWikipediaData(term),
        getDuckDuckGoData(term),
        getNewsData(term),
        getWikidata(term)
      ]);
  
      console.log('News Data received:', newsData); // Debug log
  
      const scores = calculateScores(trendsData, wikiData, ddgData, newsData, wikidataData);
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
  
  