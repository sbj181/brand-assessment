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
  articles?: any[];
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
      news?: {
        articles: Array<{ title: string; description: string; publishedAt: string; url: string }>;
      };
      wikidata?: {
        description?: string;
        aliases?: string[];
      };
    };
  }
  