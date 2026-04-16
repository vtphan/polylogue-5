import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroup, loadActiveConfig } from "@/lib/config";
import { loadLessonPackage } from "@/lib/content";
import { selectStudentAction } from "@/app/actions";

type StudentSelectionPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function StudentSelectionPage({
  params,
}: StudentSelectionPageProps) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) {
    notFound();
  }

  const config = await loadActiveConfig();
  const lessonPackage = await loadLessonPackage(config.episode.source);

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Episode · {lessonPackage.episode.title}</p>
        <h1>{group.name}</h1>
        <p>Select your name to continue.</p>
      </header>

      <section className="panel stack">
        <p className="eyebrow">Step 2 of 2</p>
        <h2>Who are you?</h2>
        <ul className="selector-list">
          {group.students.map((student) => (
            <li key={student.student_id} className="selector-item">
              <form action={selectStudentAction}>
                <input type="hidden" name="group_id" value={group.group_id} />
                <input type="hidden" name="student_id" value={student.student_id} />
                <button type="submit">
                  <div className="selector-title">{student.name}</div>
                </button>
              </form>
            </li>
          ))}
        </ul>
        <Link className="back-link" href="/">
          ← Back to groups
        </Link>
      </section>
    </div>
  );
}
