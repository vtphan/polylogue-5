"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoreEssenceView } from "./core-essence";
import { IllustrativeExampleView } from "./illustrative-example";
import { ReferenceView } from "./reference";

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
  quality_range: { strong: string; weak: string };
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

export default function ExplorerPage() {
  const [data, setData] = useState<FrameworkData | null>(null);
  const [level, setLevel] = useState<string>("essence");

  useEffect(() => {
    fetch("/api/reference/framework")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading framework data...</p>;
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Framework Explorer</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Understand the perspectival learning model through three progressive levels of detail.
      </p>
      <Tabs value={level} onValueChange={setLevel}>
        <TabsList>
          <TabsTrigger value="essence">Core Essence</TabsTrigger>
          <TabsTrigger value="example">Illustrative Example</TabsTrigger>
          <TabsTrigger value="reference">Reference</TabsTrigger>
        </TabsList>
        <TabsContent value="essence">
          <CoreEssenceView onNavigate={setLevel} />
        </TabsContent>
        <TabsContent value="example">
          <IllustrativeExampleView data={data} onNavigate={setLevel} />
        </TabsContent>
        <TabsContent value="reference">
          <ReferenceView data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
