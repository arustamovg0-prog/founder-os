import { RoadmapStage } from '@/types';

// ─── Constant Roadmap Stages ────────────────────────────────────────────────────
export const ROADMAP_STAGES: RoadmapStage[] = [
  {
    id: 'stage_1_discovery',
    order: 1,
    title: 'Problem Discovery',
    description: 'Identify and validate the core problem you are solving',
    phase: 'discovery',
    isGatekeeper: false,
    requiredArtifacts: [
      { key: 'problem_statement', label: 'Problem Statement Doc', type: 'file', isRequired: true },
      { key: 'customer_interviews', label: 'Customer Interviews (5+)', type: 'form', isRequired: true },
    ],
    unlockConditions: { previousStageCompleted: false, minScore: null, adminVerificationRequired: false },
  },
  {
    id: 'stage_2_validation',
    order: 2,
    title: 'Solution Validation',
    description: 'Validate your solution hypothesis with real users',
    phase: 'validation',
    isGatekeeper: false,
    requiredArtifacts: [
      { key: 'customer_dev_report', label: 'Customer Dev Report', type: 'file', isRequired: true },
      { key: 'value_proposition', label: 'Value Proposition Canvas', type: 'file', isRequired: true },
    ],
    unlockConditions: { previousStageCompleted: true, minScore: null, adminVerificationRequired: false },
  },
  {
    id: 'stage_3_mvp',
    order: 3,
    title: 'MVP Development',
    description: 'Build and launch your Minimum Viable Product',
    phase: 'building',
    isGatekeeper: true,
    requiredArtifacts: [
      { key: 'mvp_demo', label: 'MVP Demo / Link', type: 'file', isRequired: true },
      { key: 'unit_economics', label: 'Unit Economics Model', type: 'file', isRequired: true },
    ],
    unlockConditions: { previousStageCompleted: true, minScore: 40, adminVerificationRequired: true },
  },
  {
    id: 'stage_4_traction',
    order: 4,
    title: 'Traction & Growth',
    description: 'Achieve measurable traction and prove growth potential',
    phase: 'scaling',
    isGatekeeper: true,
    requiredArtifacts: [
      { key: 'traction_metrics', label: 'Traction Dashboard', type: 'metric', isRequired: true },
      { key: 'gtm_strategy', label: 'Go-To-Market Strategy', type: 'file', isRequired: true },
    ],
    unlockConditions: { previousStageCompleted: true, minScore: 60, adminVerificationRequired: true },
  },
  {
    id: 'stage_5_fundraising',
    order: 5,
    title: 'Investment Ready',
    description: 'Prepare for investor meetings and fundraising round',
    phase: 'fundraising',
    isGatekeeper: true,
    requiredArtifacts: [
      { key: 'pitch_deck', label: 'Pitch Deck (AI Scored)', type: 'file', isRequired: true },
      { key: 'financial_model', label: 'Financial Model (3yr)', type: 'file', isRequired: true },
      { key: 'executive_summary', label: 'Executive Summary', type: 'file', isRequired: true },
    ],
    unlockConditions: { previousStageCompleted: true, minScore: 75, adminVerificationRequired: true },
  },
];
