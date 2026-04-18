export interface StudentInfo {
  id: string;
  fullName: string;
}

export interface GroupInfo {
  id: string;
  label: string;
  members: StudentInfo[];
}

export interface Passage {
  passage_id: string;
  id: string; // normalized from passage_id at load time
  turns: number[];
  turn_range?: [number, number];
}

export interface Turn {
  speaker: string;
  text: string; // normalized at load time from sentences
  turn_id?: string;
  sentences?: { text: string; sentence_id: string }[];
}

export interface Persona {
  name: string;
  perspective?: string;
}

export interface SessionConfig {
  id: string;
  status: string;
  lensAssignmentMode: string;
  selectedPassages: string[] | null;
  scaffoldingSentenceStarters: boolean;
  scaffoldingReferenceLists: boolean;
  thresholdEvaluate: number | null;
  thresholdExplain: number | null;
}

export interface EvalResponse {
  id: string;
  sessionId: string;
  studentId: string;
  passageId: string;
  step: string;
  lensId: string;
  rating: string | null;
  content: string;
  hintUsed: boolean | null;
  redirectTriggered: boolean | null;
  createdAt: string;
  student?: StudentInfo;
}

export interface ExplResponse {
  id: string;
  sessionId: string;
  studentId: string;
  passageId: string;
  step: string;
  content: string;
  hintUsed: boolean | null;
  createdAt: string;
  student?: StudentInfo;
}

export interface ConsensusEntry {
  id: string;
  sessionId: string;
  sessionGroupId: string;
  passageId: string;
  phase: string;
  position: string;
  rationale: string;
  submittedBy: string;
  createdAt: string;
}

// Scaffolding from pipeline artifacts
export interface PassageScaffolding {
  passage_id: string;
  evaluate?: {
    difficulty?: string;
    lens_entry_prompts?: Record<string, string>;
    partial_hints?: Record<string, string[]>;
    ai_reflection_prompts?: Record<string, string>;
  };
  explain?: {
    bridge_prompts?: Record<string, string>;
    passage_sentence_starters?: string[];
    ai_reflection_prompt?: string;
  };
  common_misreadings?: Record<string, { trigger: string; redirect: string }[]>;
  observation_rubric?: Record<string, unknown>;
}

export type SessionStep =
  | "onboarding"
  | "reading"
  | "lens-assignment"
  | "evaluate-individual"
  | "evaluate-peer"
  | "evaluate-ai"
  | "evaluate-consensus"
  | "explain-individual"
  | "explain-peer"
  | "explain-ai"
  | "explain-consensus"
  | "complete";

export const LENS_LABELS: Record<string, string> = {
  logic: "Logic",
  evidence: "Evidence",
  scope: "Scope",
};

export const LENS_QUESTIONS: Record<string, string> = {
  logic: "Does the reasoning hold?",
  evidence: "Is the claim supported?",
  scope: "Is the analysis thorough?",
};
