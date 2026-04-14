export type EpisodeStatus =
  | "planning_only"
  | "transcript_ready"
  | "partial_v2"
  | "complete_v2";

export type ArtifactFileName =
  | "episode.yaml"
  | "transcript.yaml"
  | "ground_truth.yaml"
  | "diagnostic.yaml"
  | "prose.yaml"
  | "discussion.yaml"
  | "assistive_package.yaml"
  | "pipeline_log.yaml"
  | "ground_truth_generated.yaml"
  | "diagnostic_generated.yaml"
  | "prose_generated.yaml"
  | "discussion_generated.yaml";

export interface StorySummary {
  storyId: string;
  title: string;
  storyPath: string;
  episodeCount: number;
  completedEpisodeCount: number;
  inProgressEpisodeCount: number;
  lastUpdated?: string;
  episodes: EpisodeSummary[];
}

export interface EpisodeSummary {
  storyId: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  status: EpisodeStatus;
  topic?: string;
  fileNames: ArtifactFileName[];
  availableFiles: Partial<Record<ArtifactFileName, string>>;
  lastUpdated?: string;
  lastPipelineEvent?: string;
}

export interface EpisodeBundle extends EpisodeSummary {
  files: Partial<Record<ArtifactFileName, unknown>>;
  rawFiles: Partial<Record<ArtifactFileName, string>>;
  derived: {
    turnCount: number;
    passageCount: number;
    probeTurnCount: number;
    discussionCueCount: number;
  };
}
