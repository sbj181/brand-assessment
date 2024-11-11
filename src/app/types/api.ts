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

export interface HealthData {
    scores: Scores;
    data: {
      trends?: {
        default?: {
          timelineData: Array<{ formattedAxisTime: string; value: number[] }>;
        };
      };
      wiki?: {
        extract: string;
      };
      ddg?: {
        abstract: string;
        AbstractURL?: string;
        RelatedTopics?: Array<{ Icon?: { URL: string }; Text: string; FirstURL?: string }>;
      };
      news?: NewsData;
      wikidata?: {
        description?: string;
        aliases?: string[];
      };
      google?: {
        items: Array<{ title: string; snippet: string; link: string }>; // Add google results structure
      };
    };
  }
  