import { loadSessionBundle } from "@/lib/content/loaders";
import type { LoaderBundle } from "@/lib/types/content";

export const DEFAULT_CONFIG_ID = "forest-ep01-table-a";

export async function loadDefaultLensBundle(): Promise<LoaderBundle> {
  return loadSessionBundle(DEFAULT_CONFIG_ID);
}
