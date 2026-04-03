"use client";

import type { LandingCopy } from "@/lib/i18n/landingCopy";

export function StorySection({ copy }: { copy: LandingCopy["story"] }) {
  return (
    <section id="caos">
      <div className="ig-container">
        <div className="caos-header anim">
          <div className="warn-tag">
            <span
              className="blink"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--warning)",
                display: "inline-block",
              }}
            />
            {copy.warnTag}
          </div>
          <h2>{copy.h2}</h2>
          <p>{copy.p}</p>
        </div>
        <div className="caos-grid">
          <div className="anim">
            <div className="col-title">
              <div className="col-icon">✉️</div>
              <h3>{copy.colTech}</h3>
            </div>
            <div className="mock mock-dark">
              <div className="email-from">{copy.emailFrom}</div>
              <div className="email-subject">{copy.emailSubject}</div>
              <div className="email-line-d" style={{ width: "90%" }} />
              <div className="email-line-d" style={{ width: "75%" }} />
              <div className="email-line-d" style={{ width: "60%" }} />
              <div className="email-status">
                <span
                  className="blink"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--warning)",
                    display: "inline-block",
                  }}
                />
                {copy.emailStatus}
              </div>
            </div>
            <div className="mock mock-dark" style={{ padding: 0, overflow: "hidden" }}>
              <div className="wa-header">{copy.waHeader}</div>
              <div style={{ padding: 12 }}>
                <div className="wa-bubble wa-in">{copy.wa1}</div>
                <div className="wa-bubble wa-out">{copy.wa2}</div>
                <div className="wa-bubble wa-in">{copy.wa3}</div>
                <div className="wa-bubble wa-out">{copy.wa4}</div>
                <div className="wa-unread">{copy.waUnread}</div>
              </div>
            </div>
          </div>
          <div className="anim d1">
            <div className="col-title">
              <div className="col-icon">📅</div>
              <h3>{copy.colDates}</h3>
            </div>
            <div className="mock mock-white">
              <div className="chain-subject">{copy.chainSubject}</div>
              {copy.chainLines.map((line, i) => (
                <div
                  key={i}
                  className="chain-line"
                  style={{ opacity: [0.4, 0.5, 0.65, 0.8, 1][i] ?? 1 }}
                >
                  {line}
                </div>
              ))}
              <div className="chain-footer">{copy.chainFooter}</div>
            </div>
            <div className="postit">
              {copy.postitLines[0]}
              <br />
              {copy.postitLines[1]}
              <br />
              {copy.postitLines[2]}
              <br />
              {copy.postitLines[3]}
              <div className="no-data">{copy.postitNoData}</div>
            </div>
          </div>
          <div className="anim d2">
            <div className="col-title">
              <div className="col-icon">🏢</div>
              <h3>{copy.colCompany}</h3>
            </div>
            <div className="mock mock-white">
              <div className="li-header">
                <span className="li-logo">in</span>
                <span className="li-company">{copy.liCompany}</span>
              </div>
              <div className="li-title">{copy.liTitle}</div>
              <div className="li-sub">{copy.liSub}</div>
              <div className="li-stat">{copy.liStat}</div>
              <div className="li-warn">
                <span
                  className="blink"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--warning)",
                    display: "inline-block",
                  }}
                />
                {copy.liWarn}
              </div>
            </div>
            <div className="red-stats">
              <div className="red-stat">
                <strong>{copy.red1.strong}</strong>
                <br />
                <span style={{ color: "var(--steel-400)" }}>{copy.red1.sub}</span>
              </div>
              <div className="red-stat">
                <strong>{copy.red2.strong}</strong>
                <br />
                <span style={{ color: "var(--steel-400)" }}>{copy.red2.sub}</span>
              </div>
              <div className="red-stat">
                <strong>{copy.red3.strong}</strong>
                <br />
                <span style={{ color: "var(--steel-400)" }}>{copy.red3.sub}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="transition-slide">
        <div className="ts-inner">
          <div className="ts-line ts-line-1 anim">{copy.ts1}</div>
          <div className="ts-line ts-line-2 anim d1">{copy.ts2}</div>
          <div className="ts-divider anim d2" />
          <div className="ts-line ts-line-3 anim d3">{copy.ts3}</div>
        </div>
      </div>
    </section>
  );
}
