import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

export async function GET() {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const refDir = path.resolve(process.cwd(), "../configs/reference");

  const [lensesRaw, facetsRaw, evRaw] = await Promise.all([
    fs.readFile(path.join(refDir, "lenses.yaml"), "utf-8"),
    fs.readFile(path.join(refDir, "facet_inventory.yaml"), "utf-8"),
    fs.readFile(path.join(refDir, "explanatory_variables.yaml"), "utf-8"),
  ]);

  const lensesData = yaml.load(lensesRaw) as { lenses: unknown[] };
  const facetsData = yaml.load(facetsRaw) as { facets: unknown[] };
  const evData = yaml.load(evRaw) as {
    cognitive_patterns: unknown[];
    social_dynamics: unknown[];
  };

  return NextResponse.json({
    lenses: lensesData.lenses,
    facets: facetsData.facets,
    explanatoryVariables: {
      cognitive_patterns: evData.cognitive_patterns,
      social_dynamics: evData.social_dynamics,
    },
  });
}
