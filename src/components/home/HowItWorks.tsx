"use client";

import Link from "next/link";
import type { LandingCopy } from "@/lib/i18n/landingCopy";

export function HowItWorks({ copy }: { copy: LandingCopy["how"] }) {
  const { s1, s2, s3, s4, s5, midCta } = copy;

  return (
    <>
      <section className="step-section">
        <div className="ig-container step-inner">
          <span className="step-num">01</span>
          <div className="anim">
            <div className="step-label">{copy.stepLabel(1)}</div>
            <h2 className="step-title">{s1.title}</h2>
            <p className="step-desc">{s1.desc}</p>
            <Link href="/auth?mode=signup&role=technician" className="btn-gold" style={{ fontSize: 12, padding: "10px 20px" }}>
              {s1.btn}
            </Link>
          </div>
          <div className="step-visual anim d1">
            <div className="profile-form">
              <div className="form-title">{s1.formTitle}</div>
              {s1.labels.map((label, ri) => (
                <div className="form-row" key={label}>
                  <div className="form-label">{label}</div>
                  <div className="form-chips">
                    {s1.chips[ri].labels.map((lab, j) => (
                      <span key={lab} className={`chip ${j < 2 ? "active" : ""}`}>
                        {lab}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="step-section">
        <div className="ig-container step-inner">
          <span className="step-num">02</span>
          <div className="anim">
            <div className="step-label">{copy.stepLabel(2)}</div>
            <h2 className="step-title">{s2.title}</h2>
            <p className="step-desc">
              {s2.descPart1}
              <strong style={{ color: "var(--gold-500)" }}>Certificado AMX</strong>
              {s2.descPart2}
              <strong style={{ color: "var(--gold-500)" }}>logBook360</strong>
              {s2.descPart3}
            </p>
          </div>
          <div className="step-visual anim d1">
            <div className="docs-area">
              <div className="doc-stack">
                <div className="doc-card" style={{ transform: "rotate(-5deg)", top: 8, left: 0, zIndex: 1 }}>
                  <div className="doc-pdf">PDF</div>
                  <div className="doc-name">Type_Rating_B737.pdf</div>
                  <div className="doc-lines">
                    <div style={{ width: "100%" }} />
                    <div style={{ width: "75%" }} />
                  </div>
                </div>
                <div className="doc-card" style={{ transform: "rotate(-1deg)", top: 4, left: 8, zIndex: 2 }}>
                  <div className="doc-pdf">PDF</div>
                  <div className="doc-name">Logbook_2024.pdf</div>
                  <div className="doc-lines">
                    <div style={{ width: "100%" }} />
                    <div style={{ width: "80%" }} />
                  </div>
                </div>
                <div className="doc-card" style={{ transform: "rotate(3deg)", top: 0, left: 16, zIndex: 3 }}>
                  <div className="doc-pdf">PDF</div>
                  <div className="doc-name">Licence_EASA_B1.pdf</div>
                  <div className="doc-lines">
                    <div style={{ width: "100%" }} />
                    <div style={{ width: "70%" }} />
                  </div>
                </div>
              </div>
              <div className="arrow-down">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="var(--gold-500)">
                  <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                </svg>
                <span>{s2.uploadHint}</span>
              </div>
              <div className="upload-zone">
                <svg viewBox="0 0 24 24">
                  <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                </svg>
                {s2.uploadBtn}
              </div>
              <div className="arrow-right-row">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="var(--gold-500)">
                  <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                </svg>
                <span>{s2.becomes}</span>
              </div>
              <div className="docs-sum">
                <div className="docs-sum-item">
                  <div className="ds-label">{s2.cert}</div>
                  <div className="ds-val ds-amx">✓ AMX-4471</div>
                </div>
                <div className="docs-sum-plus">+</div>
                <div className="docs-sum-item">
                  <div className="ds-label">{s2.analysis}</div>
                  <div className="ds-val ds-lb">
                    log<span>Book</span>360
                  </div>
                </div>
                <div className="docs-sum-eq">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {s2.profileLine1}
                  <br />
                  {s2.profileLine2}
                </div>
              </div>
              <div className="tech-card-real">
                <div className="tcr-top">
                  <div className="tcr-left">
                    <div className="tcr-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                    </div>
                    <div>
                      <div className="tcr-id">
                        ID: <strong>AMX-4471</strong>
                      </div>
                      <div className="tcr-amx-badge">
                        <svg viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        {s2.amxBadge}
                      </div>
                    </div>
                  </div>
                  <div className="tcr-tools">
                    <div className="tcr-select" />
                    <button type="button" className="tcr-tools-btn">
                      {s2.tools}
                    </button>
                  </div>
                </div>
                <div className="tcr-grid">
                  <div>
                    <div className="tcr-col-label">{s2.licenses}</div>
                    <div className="tcr-col-val">
                      <span className="tcr-license">B1.1</span>
                      <span className="tcr-license">B2</span>
                    </div>
                  </div>
                  <div>
                    <div className="tcr-col-label">{s2.aircraft}</div>
                    <div className="tcr-col-val" style={{ fontSize: 10 }}>
                      737 NG, 787 Dreamliner +2
                    </div>
                  </div>
                  <div>
                    <div className="tcr-col-label">{s2.specialties}</div>
                    <div className="tcr-col-val" style={{ fontSize: 10 }}>
                      Line Maintenance, Base Maintenance +8
                    </div>
                  </div>
                </div>
                <div className="tcr-btns">
                  <button type="button" className="tcr-btn-amx">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                    {s2.viewAmx}
                  </button>
                  <button type="button" className="tcr-btn-req">
                    <span>›</span> {s2.request}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="step-section">
        <div className="ig-container step-inner">
          <span className="step-num">03</span>
          <div className="anim">
            <div className="step-label">{copy.stepLabel(3)}</div>
            <h2 className="step-title">{s3.title}</h2>
            <p className="step-desc">{s3.desc}</p>
            <Link href="/profile/availability" className="btn-outline" style={{ fontSize: 12, padding: "10px 20px" }}>
              {s3.btn}
            </Link>
          </div>
          <div className="step-visual anim d1">
            <div className="cal-wrap">
              <div className="cal-box">
                <div className="cal-nav">{s3.calNav}</div>
                <div className="cal-grid">
                  {s3.calDays.map((d) => (
                    <div key={d} className="cal-hd">
                      {d}
                    </div>
                  ))}
                  <div className="cal-d empty" />
                  <div className="cal-d empty" />
                  <div className="cal-d empty" />
                  <div className="cal-d empty" />
                  <div className="cal-d empty" />
                  <div className="cal-d">1</div>
                  <div className="cal-d">2</div>
                  <div className="cal-d">3</div>
                  <div className="cal-d">4</div>
                  <div className="cal-d">5</div>
                  <div className="cal-d">6</div>
                  <div className="cal-d">7</div>
                  <div className="cal-d">8</div>
                  <div className="cal-d">9</div>
                  <div className="cal-d">10</div>
                  <div className="cal-d">11</div>
                  <div className="cal-d">12</div>
                  <div className="cal-d">13</div>
                  <div className="cal-d">14</div>
                  <div className="cal-d sel">15</div>
                  <div className="cal-d range">16</div>
                  <div className="cal-d range">17</div>
                  <div className="cal-d range">18</div>
                  <div className="cal-d range">19</div>
                  <div className="cal-d range">20</div>
                  <div className="cal-d range">21</div>
                  <div className="cal-d range">22</div>
                  <div className="cal-d range">23</div>
                  <div className="cal-d range">24</div>
                  <div className="cal-d range">25</div>
                  <div className="cal-d range">26</div>
                  <div className="cal-d range">27</div>
                  <div className="cal-d range">28</div>
                  <div className="cal-d range">29</div>
                  <div className="cal-d sel">30</div>
                  <div className="cal-d">31</div>
                </div>
              </div>
              <button type="button" className="cal-save">
                {s3.save}
              </button>
              <div className="cal-status">
                <span
                  className="blink"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--teal)",
                    display: "inline-block",
                  }}
                />
                {s3.status}
              </div>
              <div className="cal-note">{s3.note}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="cta-inline anim">
        <div className="ig-container">
          <h3>{midCta.title}</h3>
          <p>{midCta.sub}</p>
          <div className="ci-btns">
            <Link href="/auth?mode=signup&role=technician" className="btn-gold">
              {midCta.btn}
            </Link>
          </div>
        </div>
      </div>

      <section className="step-section">
        <div className="ig-container step-inner">
          <span className="step-num">04</span>
          <div className="anim">
            <div className="step-label">{copy.stepLabel(4)}</div>
            <h2 className="step-title">{s4.title}</h2>
            <p className="step-desc">{s4.desc}</p>
          </div>
          <div className="step-visual anim d1">
            <div className="search-panel">
              <div className="sp-header">
                <svg viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                {s4.searchTitle}
              </div>
              <div className="sp-chips">
                {s4.chips.map((c) => (
                  <span key={c} className="sp-chip">
                    {c}
                  </span>
                ))}
              </div>
              <div className="anon-card">
                <div className="anon-avatar">?</div>
                <div className="anon-info">
                  <div className="anon-amx">AMX-2893</div>
                  <div className="anon-data">B1.1 · 737NG · MAD</div>
                  <div className="anon-stars">★★★★☆</div>
                </div>
                <div className="anon-avail">{s4.avail}</div>
              </div>
              <div className="anon-card">
                <div className="anon-avatar">?</div>
                <div className="anon-info">
                  <div className="anon-amx">AMX-7156</div>
                  <div className="anon-data">B1.1 · B2 · 737NG · PMI</div>
                  <div className="anon-stars">★★★★★</div>
                </div>
                <div className="anon-avail">{s4.avail}</div>
              </div>
              <div className="anon-card" style={{ border: "1.5px solid var(--gold-500)" }}>
                <div className="anon-avatar" style={{ borderColor: "var(--gold-500)" }}>
                  ?
                </div>
                <div className="anon-info">
                  <div className="anon-amx">AMX-4471</div>
                  <div className="anon-data">B1.1 · B2 · 737NG · LPA</div>
                  <div className="anon-stars">★★★★★</div>
                </div>
                <button type="button" className="btn-send">
                  {s4.send}
                </button>
                <div className="cursor-wrap">
                  <svg viewBox="0 0 16 20" fill="none">
                    <path
                      d="M1 1L1 15L4.5 11.5L7 17L9 16L6.5 10.5L11 10.5L1 1Z"
                      fill="white"
                      stroke="#222"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="sp-lock">{s4.lock}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="step-section">
        <div className="ig-container step-inner">
          <span className="step-num">05</span>
          <div className="anim">
            <div className="step-label">{copy.stepLabel(5)}</div>
            <h2 className="step-title">{s5.title}</h2>
            <p className="step-desc">{s5.desc}</p>
          </div>
          <div className="step-visual anim d1">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="push-notification">
                  <div className="push-app">
                    <span className="push-appname">{s5.pushApp}</span>
                    <span className="push-time">{s5.pushTime}</span>
                  </div>
                  <div className="push-title">{s5.pushTitle}</div>
                  <div className="push-sub">{s5.pushSub}</div>
                </div>
                <div className="accept-panel">
                  <div className="accept-q">{s5.q}</div>
                  <button type="button" className="accept-btn accept-umbrella">
                    {s5.b1}
                  </button>
                  <button type="button" className="accept-btn accept-auto">
                    {s5.b2}
                  </button>
                  <button type="button" className="accept-btn accept-reject">
                    {s5.b3}
                  </button>
                  <div className="accept-success">{s5.success}</div>
                  <div className="accept-success-sub">
                    {s5.successSubLine1}
                    <br />
                    {s5.successSubLine2}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
