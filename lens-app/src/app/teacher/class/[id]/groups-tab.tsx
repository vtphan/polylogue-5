"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Student {
  id: string;
  fullName: string;
}

interface GroupMembership {
  student: Student;
}

interface GroupData {
  id: string;
  label: string;
  memberships: GroupMembership[];
}

function DraggableStudent({
  student,
  groupId,
}: {
  student: Student;
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

function DroppableGroup({
  group,
  children,
}: {
  group: { id: string; label: string };
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: group.id });

  return (
    <Card
      ref={setNodeRef}
      className={`min-h-[120px] ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{group.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}

const UNGROUPED_ID = "__ungrouped__";

export function GroupsTab({
  classId,
  groups,
  allStudents,
  onUpdate,
}: {
  classId: string;
  groups: GroupData[];
  allStudents: Student[];
  onUpdate: () => void;
}) {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Find ungrouped students
  const groupedIds = new Set(
    groups.flatMap((g) => g.memberships.map((m) => m.student.id))
  );
  const ungrouped = allStudents.filter((s) => !groupedIds.has(s.id));

  async function handleCreateGroup() {
    const label = `Group ${String.fromCharCode(65 + groups.length)}`;
    await fetch(`/api/classes/${classId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    onUpdate();
  }

  async function handleDeleteGroup(groupId: string) {
    await fetch(`/api/classes/${classId}/groups/${groupId}`, {
      method: "DELETE",
    });
    onUpdate();
  }

  function handleDragStart(event: DragStartEvent) {
    const { student } = event.active.data.current as {
      student: Student;
      fromGroupId: string;
    };
    setActiveStudent(student);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveStudent(null);
    const { active, over } = event;
    if (!over) return;

    const { student, fromGroupId } = active.data.current as {
      student: Student;
      fromGroupId: string;
    };
    const toGroupId = over.id as string;

    if (fromGroupId === toGroupId) return;

    // If dropping on ungrouped pool, remove from group
    if (toGroupId === UNGROUPED_ID) {
      await fetch(`/api/classes/${classId}/groups/${fromGroupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
    } else {
      // Add to target group (API handles removing from previous group)
      await fetch(`/api/classes/${classId}/groups/${toGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
    }

    onUpdate();
  }

  return (
    <div className="space-y-4 pt-4">
      <Button onClick={handleCreateGroup}>New Group</Button>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id}>
              <DroppableGroup group={g}>
                {g.memberships.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Drag students here
                  </p>
                ) : (
                  g.memberships.map((m) => (
                    <DraggableStudent
                      key={m.student.id}
                      student={m.student}
                      groupId={g.id}
                    />
                  ))
                )}
              </DroppableGroup>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs text-muted-foreground"
                onClick={() => handleDeleteGroup(g.id)}
              >
                Delete group
              </Button>
            </div>
          ))}

          {/* Ungrouped pool */}
          <DroppableGroup group={{ id: UNGROUPED_ID, label: "Ungrouped" }}>
            {ungrouped.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                All students are grouped
              </p>
            ) : (
              ungrouped.map((s) => (
                <DraggableStudent
                  key={s.id}
                  student={s}
                  groupId={UNGROUPED_ID}
                />
              ))
            )}
          </DroppableGroup>
        </div>

        <DragOverlay>
          {activeStudent && (
            <div className="rounded border bg-background px-3 py-2 text-sm shadow-lg">
              {activeStudent.fullName}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
