import Link from "next/link";
import { createStudentAction, selectStudentAction } from "@/app/actions";
import { getActiveStudentFromCookies, listStudents } from "@/lib/students";

export default async function HomePage() {
  const [activeStudent, students] = await Promise.all([
    getActiveStudentFromCookies(),
    listStudents(),
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
            <input type="hidden" name="redirect_to" value="/stories" />
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
                    <input type="hidden" name="redirect_to" value="/stories" />
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

  const orderedStudents = [...students].sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.id.localeCompare(right.id),
  );

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Profiles</p>
        <h1>Who is reading today?</h1>
      </header>

      <ul className="selector-list home-profile-list">
        {orderedStudents.map((student) => (
          <li key={student.id} className="selector-item home-profile-item">
            {student.id === activeStudent.id ? (
              <Link href="/stories" className="selector-target home-profile-chip home-profile-chip--active">
                <span className="selector-title">{student.name}</span>
              </Link>
            ) : (
              <form action={selectStudentAction}>
                <input type="hidden" name="student_id" value={student.id} />
                <input type="hidden" name="redirect_to" value="/stories" />
                <button type="submit" className="selector-target home-profile-chip">
                  <span className="selector-title">{student.name}</span>
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form action={createStudentAction} className="stack">
        <label className="sr-only" htmlFor="student-name-secondary">
          Add new student name
        </label>
        <input
          id="student-name-secondary"
          name="name"
          type="text"
          required
          maxLength={40}
          placeholder="Add new student name, hit Enter"
        />
        <input type="hidden" name="redirect_to" value="/stories" />
      </form>
    </div>
  );
}
