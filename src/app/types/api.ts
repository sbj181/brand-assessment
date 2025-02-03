// Add these type definitions at the top of the file
interface DuckDuckGoIcon {
  URL?: string;
  Height?: string;
  Width?: string;
}

interface DuckDuckGoTopic {
  FirstURL?: string;
  Icon?: DuckDuckGoIcon;
  Result?: string;
  Text?: string;
}

// Base interfaces for API responses
export interface TimelineDataPoint {
  time: string;
  formattedTime: string;
  value: number[];
}

export interface TrendsData {
  default: {
    timelineData: TimelineDataPoint[];
    errorMessage?: string;
    errorDetails?: {
      timestamp: string;
      term: string;
    };
  };
}

export interface WikiData {
  extract?: string;
}

export interface DuckDuckGoData {
  RelatedTopics?: Array<{
    FirstURL?: string;
    Text?: string;
    Result?: string;
    Icon?: {
      URL?: string;
    };
  }>;
}

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export interface NewsData {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export interface WikidataResult {
  id?: string;
  label?: string;
  description?: string;
  search?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
}

// Scoring interfaces
export interface Scores {
  searchTrend: number;
  wikipedia: number;
  searchResults: number;
  newsCoverage: number;
  wikidata: number;
  googlePresence: number;
  sentiment: number;
  overall: number;
}

// Sentiment analysis interfaces
export interface SocialMediaMetrics {
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
}

export interface NewsMediaMetrics {
  coverage: string;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recentTrends: string[];
}

export interface IndustryContext {
  marketPosition: string;
  competitorComparison: string;
  industryTrends: string[];
}

export interface DetailedMetrics {
  brandTrust: number;
  customerLoyalty: number;
  marketPresence: number;
  innovationPerception: number;
  valueProposition: number;
}

export interface RecommendedActions {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
}

export interface AnalysisMethodology {
  dataPoints: string[];
  timeframe: string;
  confidenceScore: number;
  limitations: string[];
}

export interface SentimentAnalysis {
  overallSentiment: number;
  brandPerception: string;
  marketPosition: string;
  publicSentiment: string;
  keyStrengths: string[];
  potentialConcerns: string[];
  opportunities: string[];
  analysisBreakdown: {
    socialMedia: SocialMediaMetrics;
    newsMedia: NewsMediaMetrics;
    industryContext: IndustryContext;
  };
  detailedMetrics: DetailedMetrics;
  recommendedActions: RecommendedActions;
  analysisMethodology: AnalysisMethodology;
}

export interface SentimentResponse {
  overallSentiment: number;
  brandPerception: string;
  marketPosition: string;
  publicSentiment: string;
  socialMetrics: {
    twitter: {
      total: number;
      daily: number[];
      trend: 'up' | 'down' | 'stable';
    };
    linkedin: {
      total: number;
      daily: number[];
      trend: 'up' | 'down' | 'stable';
    };
    facebook: {
      total: number;
      daily: number[];
      trend: 'up' | 'down' | 'stable';
    };
    totalMentions: number;
  };
  socialInsight: string;
  brandReach: string;
  keyStrengths: string[];
  potentialConcerns: string[];
  opportunities: string[];
  competitors?: Array<{
    name: string;
    type: string;
    sentiment: 'higher' | 'lower' | 'similar';
  }>;
}

export function isSentimentResponse(data: any): data is SentimentResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.overallSentiment === 'number' &&
    typeof data.brandPerception === 'string' &&
    typeof data.marketPosition === 'string' &&
    typeof data.socialMetrics === 'object' &&
    typeof data.socialInsight === 'string' &&
    typeof data.brandReach === 'string' &&
    Array.isArray(data.keyStrengths) &&
    Array.isArray(data.potentialConcerns)
  );
}

type Competitor = {
  name: string;
  type: 'direct' | 'indirect' | 'potential';
  sentiment: 'higher' | 'lower' | 'similar';
  marketShare?: string;
  strengths?: string[];
  description?: string;
}

// Main health data interface
export interface HealthData {
  scores: {
    overall: number;
    searchTrend: number;
    wikipedia: number;
    searchResults: number;
    newsCoverage: number;
    wikidata: number;
    googlePresence: number;
    sentiment: number;
  };
  data: {
    ddg?: {
      abstract?: string;
      AbstractURL?: string;
      RelatedTopics: DuckDuckGoTopic[];
    };
    news?: {
      articles: Array<{
        title: string;
        description: string;
        url: string;
        publishedAt: string;
      }>;
    };
    wiki?: {
      extract?: string;
    };
    wikidata?: {
      description?: string;
      aliases?: string[];
    };
    google?: {
      items?: Array<{
        title: string;
        link: string;
        snippet: string;
      }>;
    };
    trends?: {
      default?: {
        timelineData: Array<{
          value: number[];
          formattedAxisTime: string;
        }>;
      };
    };
    sentiment: {
      overallSentiment: number;
      brandPerception: string;
      marketPosition: string;
      socialMetrics: {
        twitter: { total: number; daily: number[]; trend: 'up' | 'down' | 'stable' };
        linkedin: { total: number; daily: number[]; trend: 'up' | 'down' | 'stable' };
        facebook: { total: number; daily: number[]; trend: 'up' | 'down' | 'stable' };
        totalMentions: number;
      };
      socialInsight: string;
      brandReach: string;
      keyStrengths: string[];
      potentialConcerns: string[];
      opportunities: string[];
      competitors: Competitor[];
    };
    term: string;
  };
}