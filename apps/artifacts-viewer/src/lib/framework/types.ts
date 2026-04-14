export interface Lens {
  id: string;
  name: string;
  question: string;
  description: string;
}

export interface Facet {
  id: string;
  name: string;
  definition: string;
  quality_range: {
    strong: string;
    weak: string;
  };
  primary_lens: string;
  cross_lens_visibility: string[];
  explanatory_connections: {
    cognitive_patterns: string[];
    social_dynamics: string[];
  };
  priority_tier: string;
}

export interface ExplanatoryVariable {
  id: string;
  name: string;
  description: string;
}

export interface FrameworkData {
  lenses: Lens[];
  facets: Facet[];
  explanatoryVariables: {
    cognitive_patterns: ExplanatoryVariable[];
    social_dynamics: ExplanatoryVariable[];
  };
}
