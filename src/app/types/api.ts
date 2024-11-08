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