import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import type { FrameworkData } from "@/lib/framework/types";

function repoRoot() {
  return path.resolve(process.cwd(), "..", "..");
}

export async function loadFrameworkData(): Promise<FrameworkData> {
  const referenceDir = path.join(repoRoot(), "framework", "reference");
  const [lensesRaw, facetsRaw, explanatoryRaw] = await Promise.all([
    fs.readFile(path.join(referenceDir, "lenses.yaml"), "utf8"),
    fs.readFile(path.join(referenceDir, "facet_inventory.yaml"), "utf8"),
    fs.readFile(path.join(referenceDir, "explanatory_variables.yaml"), "utf8"),
  ]);

  const lensesData = yaml.load(lensesRaw) as { lenses: FrameworkData["lenses"] };
  const facetsData = yaml.load(facetsRaw) as { facets: FrameworkData["facets"] };
  const explanatoryData = yaml.load(explanatoryRaw) as FrameworkData["explanatoryVariables"];

  return {
    lenses: lensesData.lenses,
    facets: facetsData.facets,
    explanatoryVariables: {
      cognitive_patterns: explanatoryData.cognitive_patterns,
      social_dynamics: explanatoryData.social_dynamics,
    },
  };
}
