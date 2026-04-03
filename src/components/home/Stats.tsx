"use client";

import type { LandingCopy } from "@/lib/i18n/landingCopy";

export function Stats({ copy }: { copy: LandingCopy["stats"] }) {
  return (
    <section id="stats">
      <div className="ig-container">
        <div className="stats-grid anim">
          <div className="stat-item">
            <div className="stat-num counter" data-target="76">
              0
            </div>
            <div className="stat-lbl">{copy.t1}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num counter" data-target="1">
              0
            </div>
            <div className="stat-lbl">{copy.t2}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{ color: "var(--teal)" }}>
              100%
            </div>
            <div className="stat-lbl">{copy.t3}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{ color: "var(--steel-400)" }}>
              0
            </div>
            <div className="stat-lbl">{copy.t4}</div>
          </div>
        </div>
        <p className="organic-note">{copy.note}</p>
      </div>
    </section>
  );
}
