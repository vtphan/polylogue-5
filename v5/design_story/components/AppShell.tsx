"use client";

import { useState } from "react";
import { ChatPane } from "./ChatPane";
import { ArtifactPane } from "./ArtifactPane";

export function AppShell() {
  const [artifactVersion, setArtifactVersion] = useState(0);
  const bumpArtifact = () => setArtifactVersion((v) => v + 1);

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-sm font-semibold text-slate-700">
          Polylogue — Story Design
        </h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-slate-200 bg-white">
          <ChatPane onCommit={bumpArtifact} />
        </div>
        <div className="flex-1 bg-slate-100">
          <ArtifactPane refreshSignal={artifactVersion} />
        </div>
      </div>
      <footer className="border-t border-slate-200 bg-white px-6 py-2 text-xs text-slate-500">
        Artifact refreshes on commit · Phase: shown in artifact header
      </footer>
    </main>
  );
}
