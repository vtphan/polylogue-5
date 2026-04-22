type ProfileChipProps = {
  studentName: string;
};

export function ProfileChip({ studentName }: ProfileChipProps) {
  return (
    <div className="profile-chip">
      <div>
        <p className="profile-chip__label">Active profile</p>
        <p className="profile-chip__name">{studentName}</p>
      </div>
    </div>
  );
}
