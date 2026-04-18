type ProfileChipProps = {
  studentName: string;
  completedPracticeCount: number;
  requiredPracticeCount: number;
};

export function ProfileChip({
  studentName,
  completedPracticeCount,
  requiredPracticeCount,
}: ProfileChipProps) {
  return (
    <div className="profile-chip">
      <div>
        <p className="profile-chip__label">Active profile</p>
        <p className="profile-chip__name">{studentName}</p>
      </div>
      <p className="profile-chip__meta">
        Practice {completedPracticeCount}/{requiredPracticeCount}
      </p>
    </div>
  );
}
