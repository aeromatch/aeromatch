"use client";

import Image from "next/image";
import type { LandingCopy } from "@/lib/i18n/landingCopy";

export function Ecosystem({ copy }: { copy: LandingCopy["ecosystem"] }) {
  const c = copy.cards;
  const cards = [
    { key: "training", status: "live" as const, icon: "📚", data: c.training, anim: "anim" },
    { key: "logbook", status: "beta" as const, icon: null, data: c.logbook, logo: true, anim: "anim d1" },
    { key: "appLog", status: "next" as const, icon: "📱", data: c.appLog, anim: "anim d2" },
    { key: "match147", status: "next" as const, icon: "🤝", data: c.match147, dim: true, anim: "anim d1" },
    { key: "camo", status: "next" as const, icon: "🌍", data: c.camo, dim: true, anim: "anim d2" },
    { key: "uk", status: "next" as const, icon: "🇬🇧", data: c.uk, dim: true, anim: "anim d3" },
  ];

  return (
    <section id="ecosistema">
      <div className="ig-container">
        <div className="eco-header anim">
          <div className="eco-tag">
            <span
              className="blink"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--teal)",
                display: "inline-block",
              }}
            />
            {copy.tag}
          </div>
          <h2 className="eco-title">{copy.title}</h2>
          <p className="eco-sub">{copy.sub}</p>
        </div>
        <div className="eco-grid">
          {cards.map((card) => (
            <div
              key={card.key}
              className={`eco-card ${card.anim}`}
              style={card.dim ? { opacity: 0.85 } : undefined}
            >
              <span className={`eco-status ${card.status === "live" ? "live" : card.status === "beta" ? "beta" : "next"}`}>
                {card.status === "live" ? copy.active : card.status === "beta" ? copy.beta : copy.next}
              </span>
              {card.logo ? (
                <span className="eco-icon" style={{ display: "flex", alignItems: "center" }}>
                  <Image src="/logbook360.png" alt="logBook360" width={28} height={28} />
                </span>
              ) : (
                <span className="eco-icon">{card.icon}</span>
              )}
              {card.key === "logbook" ? (
                <h3 className="ec-lb">
                  log<span>Book</span>360
                </h3>
              ) : (
                <h3>{card.data.title}</h3>
              )}
              <p>{card.data.body}</p>
              <ul>
                {card.data.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="eco-coming anim">
            <span className="eco-coming-label">{copy.radar}</span>
            <div className="eco-coming-items">
              {copy.radarItems.map((item) => (
                <span key={item} className="eco-coming-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
