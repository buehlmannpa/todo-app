"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconSettings } from "./Icons";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      <div className="spread" style={{ gap: 6 }}>
        {actions}
        <Link href="/einstellungen" className="icon-btn" aria-label="Einstellungen">
          <IconSettings size={18} />
        </Link>
      </div>
    </header>
  );
}
