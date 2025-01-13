export interface TrendsData {
  default?: {
    timelineData?: Array<{
      value: number[]
    }>
  }
}

export interface WikiData {
  extract?: string;
}

export interface DuckDuckGoData {
  RelatedTopics?: any[];
}

export interface NewsData {
  status: string;
  totalResults: number;
  articles: Array<{
    source: any;
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string;
  }>;
}

export interface WikidataResult {
  search?: any[];
}

export interface Scores {
  overall: number;
  searchTrend: number;
  wikipedia: number;
  searchResults: number;
  newsCoverage: number;
  wikidata: number;
  googlePresence: number;
}

export interface SentimentAnalysis {
  overallSentiment: number;
  brandPerception: string;
  marketPosition: string;
  publicSentiment: string;
  keyStrengths: string[];
  potentialConcerns: string[];
}

export interface HealthData {
  scores: {
    overall: number;
    sentimentScore?: number;
  };
  data: {
    trends: any;
    wiki: any;
    ddg: any;
    news: any;
    wikidata: any;
    google: any;
    sentiment: {
      overallSentiment: number;
      brandPerception: string;
      analysisBreakdown: {
        socialMedia: {
          mentionsCount: number;
          platformBreakdown: {
            [key: string]: {
              sentiment: number;
              volume: string;
            };
          };
          topHashtags: string[];
          engagementMetrics: {
            positive: number;
            neutral: number;
            negative: number;
          };
        };
        newsMedia: {
          coverage: string;
          sentimentBreakdown: {
            positive: number;
            neutral: number;
            negative: number;
          };
          recentTrends: string[];
        };
        industryContext: {
          marketPosition: string;
          competitorComparison: string;
          industryTrends: string[];
        };
      };
      keyStrengths: string[];
      potentialConcerns: string[];
      detailedMetrics: {
        brandTrust: number;
        customerLoyalty: number;
        marketPresence: number;
        innovationPerception: number;
        valueProposition: number;
      };
      recommendedActions: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
      };
      analysisMethodology: {
        dataPoints: string[];
        timeframe: string;
        confidenceScore: number;
        limitations: string[];
      };
    };
  };
}
  