export type UserRole = 'founder' | 'investor' | 'admin';
export type StartupStage = 'idea' | 'validation' | 'mvp' | 'growth' | 'investment_ready';
export type StartupStatus = 'active' | 'paused' | 'archived' | 'deal' | 'rejected' | 'pivot';
export type PitchStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'feedback_pending' | 'closed';
export type StageProgressStatus = 'locked' | 'in_progress' | 'pending_review' | 'completed';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  isVerified: boolean;
  linkedStartupId?: string | null;
  investorProfile?: {
    fund: string;
    focusAreas: string[];
    ticketSize: { min: number; max: number };
    portfolio: string[];
  };
}

export interface HistoricalMetric {
  month: string;
  mrr: number;
  users?: number;
}

export interface StartupMetrics {
  mrr: number;
  arr: number;
  mau: number;
  churnRate: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  runwayMonths: number;
  teamSize: number;
  updatedAt: Date;
}

export interface AIScores {
  pitchDeckScore: number | null;
  financialModelScore: number | null;
  overallReadinessScore: number | null;
  lastScoredAt: Date | null;
}

export interface DataRoom {
  pitchDeckUrl: string | null;
  financialModelUrl: string | null;
  executiveSummaryUrl: string | null;
  customerDevReportUrl: string | null;
  legalDocsUrl: string | null;
}

export interface Startup {
  id: string;
  founderIds: string[];
  founderName?: string;
  name: string;
  tagline: string;
  industry: string;
  stage: StartupStage;
  status: StartupStatus;
  currentRoadmapStageId: string;
  roadmapProgress: number;
  investmentReadyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metrics: StartupMetrics;
  historicalMetrics?: HistoricalMetric[];
  dataRoom: DataRoom;
  aiScores: AIScores;
  executiveSummaryAI: string | null;
  tags: string[];
  location: string;
  description?: string;
}

export interface RoadmapStage {
  id: string;
  order: number;
  title: string;
  description: string;
  phase: 'discovery' | 'validation' | 'building' | 'scaling' | 'fundraising';
  isGatekeeper: boolean;
  requiredArtifacts: {
    key: string;
    label: string;
    type: 'file' | 'form' | 'metric';
    isRequired: boolean;
  }[];
  unlockConditions: {
    previousStageCompleted: boolean;
    minScore: number | null;
    adminVerificationRequired: boolean;
  };
}

export interface RoadmapProgress {
  stageId: string;
  status: StageProgressStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  verifiedByAdminId: string | null;
  artifacts: Record<string, { url: string; uploadedAt: Date; aiScore: number | null; aiAnalysis: string | null }>;
  aiHints: string[];
  blockedReason: string | null;
}

export interface PitchEvent {
  id: string;
  startupId: string;
  startupName?: string;
  founderIds: string[];
  investorId: string;
  investorName?: string;
  status: PitchStatus;
  request: {
    sentAt: Date;
    proposedDate: Date;
    message: string;
    snapshotScore: number;
  };
  meeting: {
    confirmedDate: Date | null;
    calendarEventId: string | null;
    location: 'online' | 'offline';
    meetingUrl: string | null;
  };
  investorResponse: {
    respondedAt: Date | null;
    rejectionReason: string | null;
  };
  feedback?: {
    requestedAt: Date | null;
    submittedAt: Date | null;
    overallImpression: 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no';
    scores: { team: number; market: number; product: number; traction: number; financials: number };
    textFeedback: string;
    nextStep: 'deal' | 'reject' | 'pivot' | 'traction' | 'follow_up';
  };
  aiPostPitchAnalysis?: {
    processedAt: Date | null;
    statusDecision: string;
    analysisText: string | null;
    roadmapAdjustments: string[];
    confidence: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalFootprintLog {
  id: string;
  startupId: string;
  actorId: string;
  actorRole: 'founder' | 'admin' | 'ai_copilot' | 'investor';
  eventType: 'artifact_uploaded' | 'metric_updated' | 'stage_completed' | 'pitch_requested' | 'meeting_held' | 'feedback_received' | 'ai_analysis_done';
  description: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  timeToExecutionHours: number | null;
}
