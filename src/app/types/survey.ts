// Brand Health Assessment Types
export interface SurveyScores {
  marketPresence: number | null;
  brandReputation: number | null;
  brandIntegration: number | null;
  brandStrength: number | null;
}

// XBHI Survey Types
export interface XBHIResponses {
  recognition: number;
  trust: number;
  relevance: number;
  recommendation: number;
  reputation: number;
  innovation: number;
  resonance: number;
  satisfaction: number;
  delivery: number;
  additionalFeedback?: string;
}

export interface XBHIWeights {
  recognition: number;
  trust: number;
  relevance: number;
  recommendation: number;
  reputation: number;
  innovation: number;
  resonance: number;
  satisfaction: number;
  delivery: number;
}

// Post Integration Survey Types
export interface PostIntegrationResponses {
  experience: number;
  transition: number;
  brandStrength: number;
  additionalComments: string;
}

export interface PostIntegrationWeights {
  experience: number;
  transition: number;
  brandStrength: number;
}

export type PostIntegrationKey = keyof Omit<PostIntegrationResponses, 'additionalComments'>; 