import Link from "next/link";
import { notFound } from "next/navigation";
import { getRun } from "@/lib/runs";
import { getGroup } from "@/lib/config";
import { loadLessonPackage, loadTranscript } from "@/lib/content";

type EntryPageProps = {
  params: Promise<{ runId: string }>;
};

export default async function EpisodeEntryPage({ params }: EntryPageProps) {
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }

  const [lessonPackage, transcript, group] = await Promise.all([
    loadLessonPackage(run.episodeSource),
    loadTranscript(run.episodeSource),
    getGroup(run.groupId),
  ]);

  const student = group?.students.find((entry) => entry.student_id === run.studentId);

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">
          {group?.name ?? "Group"}
          {student?.name ? ` · ${student.name}` : ""}
        </p>
        <span className="phase-pill">Reading</span>
      </header>

      <section className="panel entry-card stack">
        <div>
          <p className="eyebrow">Episode</p>
          <h1>{lessonPackage.episode.title}</h1>
        </div>
        <p className="entry-body">{lessonPackage.episode.student_intro}</p>

        {transcript.setting_note ? (
          <div className="preview-note">
            <span className="preview-label">Where we are</span>
            {transcript.setting_note}
          </div>
        ) : null}

        <div className="entry-actions">
          <Link href={`/runs/${run.runId}/read`} className="primary">
            Start Reading
          </Link>
        </div>
      </section>
    </div>
  );
}
