import { collection, doc, DocumentData, CollectionReference } from 'firebase/firestore';
import { db } from './firebase'; // Ensure db is exported from firebase.ts

// 1. Data Models
export interface StartupProfile {
  id?: string;
  name: string;
  oneLiner: string;
  stage: string;
  industry: string;
  location: string;
  website: string;
  logo: string;
  foundedDate: string;
  teamSize: number;
  metrics: {
    mrr: number;
    users: number;
    growthPct: number;
  };
  fundraising: {
    raising: boolean;
    targetAmount: number;
    raisedAmount: number;
    valuation: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

export interface InvestorProfile {
  id?: string;
  name: string;
  firmName: string;
  focusStages: string[];
  focusIndustries: string[];
  ticketSizeMin: number;
  ticketSizeMax: number;
  logo: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface PitchDeck {
  id?: string;
  startupId: string;
  title: string;
  fileUrl: string;
  aiSummary?: string;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  status: 'draft' | 'analyzing' | 'ready';
  createdAt: Date;
}

// 2. Helper to get typed collections
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// 3. Export Typed References
export const startupsCol = createCollection<StartupProfile>('startups');
export const investorsCol = createCollection<InvestorProfile>('investors');
export const pitchesCol = createCollection<PitchDeck>('pitches');

// Helper function to get typed document reference
export const getStartupDoc = (id: string) => doc(startupsCol, id);
export const getInvestorDoc = (id: string) => doc(investorsCol, id);
export const getPitchDoc = (id: string) => doc(pitchesCol, id);
