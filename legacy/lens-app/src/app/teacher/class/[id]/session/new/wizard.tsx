"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Scenario {
  id: string;
  topic: string;
  status: string;
  publishedAt: string;
}

interface Artifacts {
  scenario: { topic: string; context: string; personas?: { name: string; perspective: string }[] };
  transcript: { turns?: { speaker: string; text: string }[]; personas?: { name: string }[] };
  facilitation: { overview?: string };
  session: { passages?: { passage_id: string; turns: number[] }[] };
  scaffolding: { passage_scaffolding?: { passage_id: string; evaluate?: { difficulty?: string } }[] };
}

interface SessionGroupMember {
  student: { id: string; fullName: string };
}

interface SessionGroup {
  id: string;
  label: string;
  memberships: SessionGroupMember[];
}

export function SessionWizard({ classId }: { classId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);

  // Config
  const [lensMode, setLensMode] = useState<"assign" | "choice">("assign");
  const [sentenceStarters, setSentenceStarters] = useState(true);
  const [referenceLists, setReferenceLists] = useState(true);
  const [thresholdEvaluate, setThresholdEvaluate] = useState<number | "">("");
  const [thresholdExplain, setThresholdExplain] = useState<number | "">("");
  const [selectedPassages, setSelectedPassages] = useState<string[]>([]);

  // Session (after creation)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then(setScenarios);
  }, []);

  async function selectScenario(id: string) {
    setSelectedScenarioId(id);

    // Load full scenario for briefing
    const res = await fetch(`/api/scenarios/${id}`);
    if (res.ok) {
      const data = await res.json();
      setArtifacts(data.artifacts);

      // Default: select all passages
      const passages = data.artifacts.session?.passages || [];
      setSelectedPassages(passages.map((p: { passage_id: string }) => p.passage_id));
    }

    setStep(2);
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError("");

    const body = {
      classId,
      scenarioId: selectedScenarioId,
      lensAssignmentMode: lensMode,
      selectedPassages,
      scaffoldingSentenceStarters: sentenceStarters,
      scaffoldingReferenceLists: referenceLists,
      thresholdEvaluate: thresholdEvaluate || null,
      thresholdExplain: thresholdExplain || null,
    };

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setSaving(false);
      return;
    }

    const session = await res.json();
    setSessionId(session.id);
    setJoinCode(session.joinCode || "");

    // Load session groups for review
    const sessionRes = await fetch(`/api/sessions/${session.id}`);
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      setSessionGroups(sessionData.sessionGroups);
    }

    setSaving(false);
    setStep(4);
  }

  async function handleActivate() {
    if (!sessionId) return;
    setError("");

    const res = await fetch(`/api/sessions/${sessionId}/activate`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    router.push(`/teacher/class/${classId}`);
  }

  // Step 1: Select scenario
  if (step === 1) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-8">
        <StepHeader classId={classId} step={1} title="Select Scenario" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer transition-colors hover:bg-accent/50 hover:shadow-md"
              onClick={() => selectScenario(s.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg leading-snug">{s.topic}</CardTitle>
                <CardDescription className="mt-1">{s.id}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Published {new Date(s.publishedAt).toLocaleDateString()}
              </CardContent>
            </Card>
          ))}
          {scenarios.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No scenarios available. Ask the researcher to import some.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Discussion briefing
  if (step === 2 && artifacts) {
    const scenario = artifacts.scenario;
    const personas = artifacts.transcript?.personas || scenario.personas || [];

    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-8">
        <StepHeader classId={classId} step={2} title="Discussion Briefing" />
        <Card>
          <CardHeader>
            <CardTitle>{scenario.topic}</CardTitle>
            <CardDescription>{scenario.context}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {personas.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium">Characters</h3>
                <div className="flex flex-wrap gap-2">
                  {personas.map((p: { name: string; perspective?: string }, i: number) => (
                    <Badge key={i} variant="outline">
                      {p.name}
                      {p.perspective && ` — ${p.perspective}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {artifacts.facilitation?.overview && (
              <div>
                <h3 className="mb-2 font-medium">Facilitation Overview</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {typeof artifacts.facilitation.overview === "string"
                    ? artifacts.facilitation.overview
                    : JSON.stringify(artifacts.facilitation.overview, null, 2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={() => setStep(3)}>Continue to Configure</Button>
        </div>
      </div>
    );
  }

  // Step 3: Configure session
  if (step === 3) {
    const passages = artifacts?.session?.passages || [];

    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-8">
        <StepHeader classId={classId} step={3} title="Configure Session" />
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Lens Assignment Mode</Label>
              <div className="flex gap-3">
                <Button
                  variant={lensMode === "assign" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLensMode("assign")}
                >
                  Assign lenses
                </Button>
                <Button
                  variant={lensMode === "choice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLensMode("choice")}
                >
                  Student choice
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Assigning lenses ensures each group has coverage across all three
                perspectives.
              </p>
            </div>

            {passages.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Highlighted Passages ({selectedPassages.length} of{" "}
                  {passages.length})
                </Label>
                <div className="space-y-1">
                  {passages.map((p: { passage_id: string }) => (
                    <label
                      key={p.passage_id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPassages.includes(p.passage_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPassages([...selectedPassages, p.passage_id]);
                          } else {
                            setSelectedPassages(
                              selectedPassages.filter((id) => id !== p.passage_id)
                            );
                          }
                        }}
                      />
                      {p.passage_id}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fewer passages means a shorter session. Passages are ordered by
                  difficulty — deselect from the bottom to keep the most
                  accessible ones.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Explanation Scaffolding</Label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sentenceStarters}
                  onChange={(e) => setSentenceStarters(e.target.checked)}
                />
                Show sentence starters in Explain phase
              </label>
              <p className="text-xs text-muted-foreground ml-5">
                Sentence starters reduce the writing burden for students who
                struggle to begin. Generic starters are always visible;
                passage-specific ones appear behind &quot;I need more help.&quot;
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={referenceLists}
                  onChange={(e) => setReferenceLists(e.target.checked)}
                />
                Show cognitive pattern and social dynamic reference lists
              </label>
              <p className="text-xs text-muted-foreground ml-5">
                Reference lists give students browsable vocabulary for explaining
                why characters reasoned the way they did. Students write in their
                own words — the lists are a reference, not a menu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thresholdEval">
                  Evaluate threshold (min passages)
                </Label>
                <Input
                  id="thresholdEval"
                  type="number"
                  min={1}
                  value={thresholdEvaluate}
                  onChange={(e) =>
                    setThresholdEvaluate(
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  placeholder="All"
                />
                <p className="text-xs text-muted-foreground">
                  The minimum number of passages a student must evaluate before
                  moving to peer discussion. A soft gate — students are
                  encouraged to continue but can proceed once they meet this
                  minimum.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thresholdExpl">
                  Explain threshold (min passages)
                </Label>
                <Input
                  id="thresholdExpl"
                  type="number"
                  min={1}
                  value={thresholdExplain}
                  onChange={(e) =>
                    setThresholdExplain(
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  placeholder="All"
                />
                <p className="text-xs text-muted-foreground">
                  Same soft gate for the Explain phase. Lower thresholds help fit
                  both phases into shorter class periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button onClick={handleSaveDraft} disabled={saving}>
            {saving ? "Saving..." : "Save Draft & Review Groups"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Step 4: Review & edit groups
  if (step === 4) {
    const groupValidation = sessionGroups
      .filter((g) => g.memberships.length < 2)
      .map((g) => g.label);

    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-8">
        <StepHeader classId={classId} step={4} title="Review Groups" />
        <p className="mb-4 text-sm text-muted-foreground">
          Drag students between groups to adjust for this session only. Class-level groups are not affected.
        </p>

        {groupValidation.length > 0 && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            Groups with fewer than 2 students: {groupValidation.join(", ")}
          </div>
        )}

        <SessionGroupEditor
          sessionId={sessionId!}
          groups={sessionGroups}
          onUpdate={async () => {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (res.ok) {
              const data = await res.json();
              setSessionGroups(data.sessionGroups);
            }
          }}
        />

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setStep(3)}>
            Back
          </Button>
          <Button onClick={() => setStep(5)}>
            Continue to Review
          </Button>
        </div>
      </div>
    );
  }

  // Step 5: Review and activate
  if (step === 5) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-8">
        <StepHeader classId={classId} step={5} title="Review & Activate" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Scenario:</span>
                <p className="font-medium">{artifacts?.scenario?.topic}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Lens mode:</span>
                <p className="font-medium">{lensMode}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Passages:</span>
                <p className="font-medium">{selectedPassages.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Groups:</span>
                <p className="font-medium">{sessionGroups.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Join code:</span>
                <p className="font-mono text-lg font-bold">{joinCode}</p>
              </div>
            </div>

            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Activating will freeze the configuration and groups. Students will
              be able to join using the code above.
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setStep(4)}>
            Back
          </Button>
          <Button onClick={handleActivate}>Activate Session</Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}

function SessionGroupDraggable({
  student,
  groupId,
}: {
  student: { id: string; fullName: string };
  groupId: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${groupId}:${student.id}`,
    data: { student, fromGroupId: groupId },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded border bg-background px-3 py-2 text-sm ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      {student.fullName}
    </div>
  );
}

function SessionGroupDroppable({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Card
      ref={setNodeRef}
      className={`min-h-[100px] ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}

function SessionGroupEditor({
  sessionId,
  groups,
  onUpdate,
}: {
  sessionId: string;
  groups: SessionGroup[];
  onUpdate: () => void;
}) {
  const [activeStudent, setActiveStudent] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const { student } = event.active.data.current as {
      student: { id: string; fullName: string };
    };
    setActiveStudent(student);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveStudent(null);
    const { active, over } = event;
    if (!over) return;

    const { student, fromGroupId } = active.data.current as {
      student: { id: string; fullName: string };
      fromGroupId: string;
    };
    const toGroupId = over.id as string;

    if (fromGroupId === toGroupId) return;

    await fetch(`/api/sessions/${sessionId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        targetGroupId: toGroupId,
      }),
    });

    onUpdate();
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <SessionGroupDroppable key={g.id} id={g.id} label={g.label}>
            {g.memberships.length === 0 ? (
              <p className="text-xs text-muted-foreground">Drag students here</p>
            ) : (
              g.memberships.map((m) => (
                <SessionGroupDraggable
                  key={m.student.id}
                  student={m.student}
                  groupId={g.id}
                />
              ))
            )}
          </SessionGroupDroppable>
        ))}
      </div>

      <DragOverlay>
        {activeStudent && (
          <div className="rounded border bg-background px-3 py-2 text-sm shadow-lg">
            {activeStudent.fullName}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function StepHeader({
  classId,
  step,
  title,
}: {
  classId: string;
  step: number;
  title: string;
}) {
  return (
    <div className="mb-6">
      <Link
        href={`/teacher/class/${classId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to class
      </Link>
      <h1 className="mt-2 text-2xl font-bold">New Session</h1>
      <p className="text-muted-foreground">
        Step {step} of 5 — {title}
      </p>
    </div>
  );
}
