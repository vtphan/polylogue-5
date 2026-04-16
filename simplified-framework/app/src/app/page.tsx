import Link from "next/link";
import { loadActiveConfig } from "@/lib/config";
import { loadLessonPackage } from "@/lib/content";

export default async function HomePage() {
  const config = await loadActiveConfig();
  const lessonPackage = await loadLessonPackage(config.episode.source);

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Episode</p>
        <h1>{lessonPackage.episode.title}</h1>
        <p>Choose your group to begin.</p>
      </header>

      <section className="panel stack">
        <p className="eyebrow">Step 1 of 2</p>
        <h2>Select your group</h2>
        <ul className="selector-list">
          {config.groups.map((group) => (
            <li key={group.group_id} className="selector-item">
              <Link href={`/groups/${group.group_id}`} className="selector-target">
                <div className="selector-title">{group.name}</div>
                <div className="selector-hint">
                  {group.students.length} student{group.students.length === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
