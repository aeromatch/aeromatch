'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { AboutCopy } from '@/lib/i18n/aboutCopy'
import { Logo } from '@/components/ui/Logo'

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 fill-gold-500 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg className="h-[18px] w-[18px] fill-gold-500" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg className="h-4 w-4 fill-gold-500" viewBox="0 0 24 24" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
    </svg>
  )
}

function FaqAnswer({ text }: { text: string }) {
  const parts = text.split(/(hola@aeromatch\.eu)/g)
  return (
    <>
      {parts.map((part, i) =>
        part === 'hola@aeromatch.eu' ? (
          <a key={i} href="mailto:hola@aeromatch.eu" className="text-gold-500 underline hover:text-gold-400">
            hola@aeromatch.eu
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function AboutContent({ copy }: { copy: AboutCopy }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const root = document.getElementById('about-page-root')
    if (!root) return
    const els = root.querySelectorAll('[data-about-anim]')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('opacity-100', 'translate-y-0')
          e.target.classList.remove('opacity-0', 'translate-y-6')
          obs.unobserve(e.target)
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [copy])

  return (
    <div id="about-page-root">
      <section className="border-b border-steel-700/50 bg-navy-950 px-6 py-16 text-center sm:py-[72px]">
        <div
          data-about-anim
          className="mx-auto max-w-[900px] translate-y-6 opacity-0 transition-all duration-700"
        >
          <div className="mb-8 flex justify-center">
            <Logo size="md" />
          </div>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" aria-hidden />
            {copy.hero.tag}
          </div>
          <h1 className="mx-auto mb-4 max-w-[640px] text-[clamp(2rem,5vw,3rem)] font-black leading-tight text-white">
            {copy.hero.h1} <em className="not-italic text-gold-500">{copy.hero.h1Em}</em>
          </h1>
          <p className="mx-auto max-w-[520px] text-[1.05rem] text-steel-200">{copy.hero.lead}</p>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <section className="bg-navy-950 px-6 py-20">
        <div className="mx-auto max-w-[680px]">
          <div
            data-about-anim
            className="translate-y-6 opacity-0 transition-all duration-700"
          >
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">
              {copy.founder.label}
            </p>
            <h2 className="mb-1.5 text-[clamp(1.6rem,3vw,2rem)] font-black text-white">{copy.founder.name}</h2>
            <p className="mb-7 text-[13px] text-steel-400">{copy.founder.role}</p>
            <div className="relative rounded-r-xl border border-steel-700/50 border-l-[3px] border-l-gold-500 bg-navy-900 py-7 pl-8 pr-7">
              <span
                className="pointer-events-none absolute left-5 top-2 font-serif text-[5rem] leading-none text-gold-500/15"
                aria-hidden
              >
                &ldquo;
              </span>
              {copy.founder.quoteParas.map((para, i) => (
                <p key={i} className="relative z-[1] mb-3.5 text-base leading-relaxed text-steel-200 last:mb-5">
                  {para}
                </p>
              ))}
              <p className="text-xs font-bold italic text-gold-500">
                {copy.founder.sigLine}{' '}
                <span className="font-normal not-italic text-steel-400">{copy.founder.sigName}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <section className="bg-navy-900 px-6 py-20">
        <div className="mx-auto max-w-[900px]">
          <div
            data-about-anim
            className="mb-12 translate-y-6 text-center opacity-0 transition-all duration-700"
          >
            <h2 className="mb-2 text-[clamp(1.6rem,3.5vw,2.2rem)] font-black text-white">{copy.values.title}</h2>
            <p className="text-[0.95rem] text-steel-400">{copy.values.subtitle}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.values.cards.map((card, i) => (
              <div
                key={card.title}
                data-about-anim
                className="translate-y-6 rounded-xl border border-steel-700/50 bg-navy-950 p-6 opacity-0 transition-all duration-700 hover:-translate-y-1 hover:border-gold-500/50"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className="mb-3.5 block text-[28px]">{card.icon}</span>
                <h3 className="mb-2 text-[15px] font-bold text-white">{card.title}</h3>
                <p className="text-[13px] leading-relaxed text-steel-400">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <section className="bg-navy-950 px-6 py-20">
        <div className="mx-auto max-w-[900px]">
          <div
            data-about-anim
            className="mb-12 translate-y-6 text-center opacity-0 transition-all duration-700"
          >
            <h2 className="mb-2 text-[clamp(1.6rem,3.5vw,2.2rem)] font-black text-white">{copy.testimonials.title}</h2>
            <p className="text-[0.95rem] text-steel-400">{copy.testimonials.subtitle}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.testimonials.items.map((t, i) => (
              <div
                key={i}
                data-about-anim
                className="translate-y-6 rounded-xl border border-steel-700/50 bg-navy-900 p-6 opacity-0 transition-all duration-700"
              >
                <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg border border-steel-700/50 bg-navy-800">
                  {t.name.includes('MRO') ? <BuildingIcon /> : <PersonIcon />}
                </div>
                <p className="mb-4 text-[13px] italic leading-relaxed text-steel-200">{t.quote}</p>
                <p className="text-[11px] text-steel-400">
                  <strong className="mb-0.5 block font-semibold not-italic text-gold-500">{t.name}</strong>
                  {t.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <section className="bg-navy-900 px-6 py-20">
        <div className="mx-auto max-w-[900px]">
          <div
            data-about-anim
            className="mb-12 translate-y-6 text-center opacity-0 transition-all duration-700"
          >
            <h2 className="mb-2 text-[clamp(1.6rem,3.5vw,2.2rem)] font-black text-white">{copy.how.title}</h2>
            <p className="text-[0.95rem] text-steel-400">{copy.how.subtitle}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div data-about-anim className="translate-y-6 opacity-0 transition-all duration-700">
              <h3 className="mb-5 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-gold-500">
                <PersonIcon />
                {copy.how.tech.title}
              </h3>
              <div className="flex flex-col">
                {copy.how.tech.steps.map((s, j) => (
                  <div key={j} className="flex gap-3.5 border-b border-steel-700/50 py-3 last:border-0">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-[10px] font-bold text-gold-500">
                      {j + 1}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{s.title}</div>
                      <div className="text-[11px] text-steel-400">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Link
                  href="/auth?mode=signup&role=technician"
                  className="inline-block rounded-lg bg-gold-500 px-5 py-2.5 text-xs font-bold text-navy-950 transition-colors hover:bg-gold-400"
                >
                  {copy.how.tech.cta}
                </Link>
              </div>
            </div>
            <div data-about-anim className="translate-y-6 opacity-0 transition-all duration-700">
              <h3 className="mb-5 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-gold-500">
                <BuildingIcon />
                {copy.how.company.title}
              </h3>
              <div className="flex flex-col">
                {copy.how.company.steps.map((s, j) => (
                  <div key={j} className="flex gap-3.5 border-b border-steel-700/50 py-3 last:border-0">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-[10px] font-bold text-gold-500">
                      {j + 1}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{s.title}</div>
                      <div className="text-[11px] text-steel-400">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Link
                  href="/auth?mode=signup&role=company"
                  className="inline-block rounded-lg border-2 border-gold-500 px-5 py-2.5 text-xs font-bold text-gold-500 transition-colors hover:bg-gold-500/10"
                >
                  {copy.how.company.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <section className="bg-navy-950 px-6 py-20">
        <div className="mx-auto max-w-[720px]">
          <div
            data-about-anim
            className="mb-10 translate-y-6 text-center opacity-0 transition-all duration-700"
          >
            <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-black text-white">{copy.faqTitle}</h2>
          </div>
          <div className="flex flex-col gap-2">
            {copy.faq.map((item, i) => {
              const open = openFaq === i
              return (
                <div
                  key={i}
                  data-about-anim
                  className="translate-y-6 overflow-hidden rounded-[10px] border border-steel-700/50 bg-navy-900 opacity-0 transition-all duration-700"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-white"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {item.q}
                    <ChevronDown open={open} />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="px-5 pb-4 pt-0">
                        <p className="text-[13px] leading-relaxed text-steel-200">
                          <FaqAnswer text={item.a} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <section className="border-t-2 border-gold-500 bg-navy-900 px-6 py-20 text-center">
        <div className="mx-auto max-w-[520px]">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-steel-400">{copy.cta.eyebrow}</p>
          <h2 className="mb-3 text-[clamp(1.5rem,3.5vw,2.2rem)] font-black text-white">{copy.cta.title}</h2>
          <p className="mb-7 text-[0.95rem] text-steel-200">{copy.cta.lead}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth?mode=signup&role=technician"
              className="inline-block rounded-lg bg-gold-500 px-6 py-3 text-[13px] font-bold text-navy-950 hover:bg-gold-400"
            >
              {copy.cta.btnTech}
            </Link>
            <Link
              href="/auth?mode=signup&role=company"
              className="inline-block rounded-lg border-2 border-gold-500 px-6 py-3 text-[13px] font-bold text-gold-500 hover:bg-gold-500/10"
            >
              {copy.cta.btnCompany}
            </Link>
          </div>
          <div className="mx-auto my-10 h-px w-[200px] bg-steel-700/50" />
          <p className="text-[11px] italic text-steel-400">
            <a href={`mailto:${copy.cta.emailNote}`} className="text-gold-500 hover:underline">
              {copy.cta.emailNote}
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-steel-700/50 bg-navy-900 px-6 py-8 text-center">
        <div className="mb-3 flex justify-center">
          <Logo size="sm" />
        </div>
        <p className="text-[11px] leading-relaxed text-steel-400">
          {copy.footer.line1}
          <br />
          {copy.footer.line2}
        </p>
      </footer>
    </div>
  )
}
