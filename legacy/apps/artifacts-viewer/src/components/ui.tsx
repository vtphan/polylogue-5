import Link from "next/link";
import type { ReactNode } from "react";
import type { ArtifactFileName, EpisodeStatus } from "@/lib/artifacts/types";

const STATUS_LABELS: Record<EpisodeStatus, string> = {
  planning_only: "Planning Only",
  transcript_ready: "Transcript Ready",
  partial_v2: "Partial v2",
  complete_v2: "Complete v2",
};

export function PageHero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="page-hero">
      <p className="page-kicker">{kicker}</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </section>
  );
}

export function StatusPill({ status }: { status: EpisodeStatus }) {
  return <span className={`pill status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function Card({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}

export function Panel({ children }: { children: ReactNode }) {
  return <section className="panel">{children}</section>;
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          {index < items.length - 1 ? " / " : ""}
        </span>
      ))}
    </nav>
  );
}

export function TabsNav({
  tabs,
  activeTab,
}: {
  tabs: Array<{ href: string; label: string }>;
  activeTab: string;
}) {
  return (
    <nav className="tabs" aria-label="Episode tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`tab ${activeTab === tab.label.toLowerCase() ? "active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function ArtifactPills({
  fileNames,
}: {
  fileNames: ArtifactFileName[];
}) {
  return (
    <div className="pill-row">
      {fileNames.map((fileName) => (
        <span key={fileName} className="pill">
          {fileName}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({
  message,
}: {
  message: string;
}) {
  return <div className="empty-state">{message}</div>;
}
