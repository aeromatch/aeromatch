"use client";

import type { LandingCopy } from "@/lib/i18n/landingCopy";

export function ShareProfile({ copy }: { copy: LandingCopy["share"] }) {
  return (
    <div className="share-strip anim">
      <div className="share-inner">
        <span className="share-soon">{copy.soon}</span>
        <h3 className="share-title">{copy.title}</h3>
        <p className="share-desc">{copy.desc}</p>
        <div className="share-url">
          {copy.urlPrefix}
          <span className="share-gold">AMX-4471</span>
        </div>
      </div>
    </div>
  );
}
