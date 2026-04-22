import Link from "next/link";
import { createStudentAction, selectStudentAction } from "@/app/actions";
import { ProfileChip } from "@/app/_components/ProfileChip";
import { StarRow } from "@/app/_components/StarRow";
import { listCatalogEpisodes } from "@/lib/catalog";
import { loadReaderLessonPackageByPaths } from "@/lib/content";
import { prisma } from "@/lib/db";
import { getActiveStudentFromCookies, listStudents } from "@/lib/students";

export default async function HomePage() {
  const [activeStudent, students, episodes] = await Promise.all([
    getActiveStudentFromCookies(),
    listStudents(),
    listCatalogEpisodes(),
  ]);

  if (!activeStudent) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">Who are you?</p>
          <h1>Choose or add a profile</h1>
          <p>This device keeps local student profiles for story progress.</p>
        </header>

        <section className="panel stack">
          <h2>Add a profile</h2>
          <form action={createStudentAction} className="stack">
            <label className="stack" htmlFor="student-name">
              <span>Name</span>
              <input id="student-name" name="name" type="text" required maxLength={40} />
            </label>
            <button type="submit" className="primary">
              Continue
            </button>
          </form>
        </section>

        {students.length > 0 ? (
          <section className="panel stack">
            <h2>Existing profiles</h2>
            <ul className="selector-list">
              {students.map((student) => (
                <li key={student.id} className="selector-item">
                  <form action={selectStudentAction}>
                    <input type="hidden" name="student_id" value={student.id} />
                    <button type="submit" className="selector-target">
                      <div className="selector-title">{student.name}</div>
                      <div className="selector-hint">Use this profile on this device</div>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  const runs = await prisma.run.findMany({
    where: { studentId: activeStudent.id },
    orderBy: [{ storyId: "asc" }, { episodeId: "asc" }],
  });
  const runsByEpisode = new Map(
    runs.map((run) => [`${run.storyId}::${run.episodeId}`, run]),
  );
  const levelCountByEpisode = new Map<string, number>();
  await Promise.all(
    episodes.map(async (episode) => {
      const key = `${episode.storyId}::${episode.episodeId}`;
      try {
        const lessonPackage = await loadReaderLessonPackageByPaths(episode.lessonPackagePath);
        levelCountByEpisode.set(key, lessonPackage.levels.length);
      } catch {
        levelCountByEpisode.set(key, 0);
      }
    }),
  );

  return (
    <div className="page-wide home-shell">
      <header className="page-header home-shell__header">
        <ProfileChip studentName={activeStudent.name} />
        <div className="stack">
          <p className="eyebrow">Home</p>
          <h1>Welcome back, {activeStudent.name}.</h1>
          <p>Pick an episode to read, or switch profiles below.</p>
        </div>
      </header>

      <section className="panel home-actions">
        <div className="home-action-card">
          <p className="eyebrow">Read a story</p>
          <h2>Open the episode picker</h2>
          <p>Resume a run in progress, or start a new episode.</p>
          <Link href="/stories" className="primary">
            Choose a story
          </Link>
        </div>
      </section>

      {episodes.length > 0 ? (
        <section className="panel stack">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow">Episodes</p>
              <h2>Story progress</h2>
            </div>
            <p className="subdued">
              Ordered by story and episode id. Star totals follow the episode&apos;s current lesson count.
            </p>
          </div>
          <ul className="episode-grid">
            {episodes.map((episode) => {
              const run = runsByEpisode.get(`${episode.storyId}::${episode.episodeId}`);
              const starsEarned = run?.starsEarned ?? 0;
              const levelCount =
                levelCountByEpisode.get(`${episode.storyId}::${episode.episodeId}`) ?? 0;
              const totalStars = levelCount * 3;

              return (
                <li key={`${episode.storyId}-${episode.episodeId}`} className="episode-card">
                  <div className="episode-card__copy">
                    <p className="episode-card__story">{episode.story.title}</p>
                    <h3>{episode.episodeTitle}</h3>
                    <p className="episode-card__episode-id">{episode.episodeId}</p>
                  </div>
                  <StarRow earned={starsEarned} total={totalStars} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="panel stack">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Profiles</p>
            <h2>Switch or add a profile</h2>
          </div>
        </div>
        <ul className="selector-list">
          {students.map((student) => (
            <li key={student.id} className="selector-item">
              <form action={selectStudentAction}>
                <input type="hidden" name="student_id" value={student.id} />
                <button type="submit" className="selector-target">
                  <div className="selector-title">{student.name}</div>
                  <div className="selector-hint">
                    {student.id === activeStudent.id ? "Current profile" : "Switch to this profile"}
                  </div>
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createStudentAction} className="stack">
          <label className="stack" htmlFor="student-name-secondary">
            <span>Add another local profile</span>
            <input
              id="student-name-secondary"
              name="name"
              type="text"
              required
              maxLength={40}
            />
          </label>
          <button type="submit" className="secondary">
            Add profile
          </button>
        </form>
      </section>
    </div>
  );
}
