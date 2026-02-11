
export interface GroundingSource {
  uri: string;
  title: string;
}

export interface FavoriteJourney {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp: Date;
  sources?: GroundingSource[];
  isJourneyResponse?: boolean;
  crowdingLevel?: 'Low' | 'Moderate' | 'High';
  disruptionAlert?: string;
  costEstimate?: string;
  accessibilityLevel?: 'Step-free' | 'Partial' | 'Complex';
}

export interface JourneyDetails {
  start?: string;
  destination?: string;
  time?: string;
  transportPreference?: string[];
  accessibility?: string;
  paymentMethod?: 'Oyster' | 'Contactless' | 'Travelcard';
}
