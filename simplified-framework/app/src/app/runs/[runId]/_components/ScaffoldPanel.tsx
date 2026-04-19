import { CollapsibleBlock } from "@/app/runs/[runId]/_components/CollapsibleBlock";
import { QuizPanel } from "@/app/runs/[runId]/_components/QuizPanel";
import type { ReaderLevel } from "@/lib/content";
import type { TranscriptTurn } from "@/lib/domain";
import type { QuizAttempt } from "@prisma/client";

type ScaffoldPanelProps = {
  runId: string;
  sceneIndex: number;
  sceneIsFirst: boolean;
  sceneSummary: string;
  episodeTitle: string;
  episodeSummary: string;
  previously: string | null;
  level: ReaderLevel | null;
  attempt: QuizAttempt | null;
  flaggedTurn: TranscriptTurn | null;
  quizOpen: boolean;
};

export function ScaffoldPanel({
  runId,
  sceneIndex,
  sceneIsFirst,
  sceneSummary,
  episodeTitle,
  episodeSummary,
  previously,
  level,
  attempt,
  flaggedTurn,
  quizOpen,
}: ScaffoldPanelProps) {
  if (quizOpen && level) {
    return (
      <aside className="scaffold-panel scaffold-panel--quiz" aria-label="Question">
        <QuizPanel
          runId={runId}
          sceneIndex={sceneIndex}
          level={level}
          attempt={attempt}
          flaggedTurn={flaggedTurn}
        />
      </aside>
    );
  }

  return (
    <aside className="scaffold-panel" aria-label="Reading scaffolds">
      <section className="scaffold-block scaffold-block--scene">
        <p className="eyebrow">Scene {sceneIndex}</p>
        <p className="scaffold-block__body">{sceneSummary}</p>
      </section>

      <CollapsibleBlock label="About this episode" defaultOpen={sceneIsFirst}>
        <p className="scaffold-block__heading">{episodeTitle}</p>
        <p>{episodeSummary}</p>
      </CollapsibleBlock>

      {previously ? (
        <CollapsibleBlock label="Previously" defaultOpen={sceneIsFirst}>
          <p>{previously}</p>
        </CollapsibleBlock>
      ) : null}
    </aside>
  );
}
