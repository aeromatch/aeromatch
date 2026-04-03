"use client";

import Link from "next/link";
import type { LandingCopy } from "@/lib/i18n/landingCopy";

export function FinalCTA({ copy }: { copy: LandingCopy["finalCta"] }) {
  return (
    <section id="cta">
      <div className="ig-container">
        <p className="cta-eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p className="cta-sub">{copy.sub}</p>
        <div className="cta-buttons">
          <Link href="/auth?mode=signup&role=technician" className="btn-gold">
            {copy.btnTech}
          </Link>
          <Link href="/auth?mode=signup&role=company" className="btn-outline">
            {copy.btnCompany}
          </Link>
        </div>
        <p className="cta-note">{copy.note}</p>
      </div>
    </section>
  );
}
