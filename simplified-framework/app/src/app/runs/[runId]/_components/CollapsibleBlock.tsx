"use client";

import { useState, type ReactNode } from "react";

type CollapsibleBlockProps = {
  label: string;
  defaultOpen: boolean;
  children: ReactNode;
};

export function CollapsibleBlock({ label, defaultOpen, children }: CollapsibleBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`scaffold-block scaffold-block--collapsible${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="scaffold-block__toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{label}</span>
        <span className="scaffold-block__chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="scaffold-block__body">{children}</div> : null}
    </section>
  );
}
