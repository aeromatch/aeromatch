"use client";

import { useEffect } from "react";

/** Replica IntersectionObserver del HTML: .anim → .in, contadores en .counter */
export function InfographicMotion() {
  useEffect(() => {
    const root = document.getElementById("am-infographic");
    if (!root) return;

    function startCounter(el: HTMLElement) {
      const raw = el.dataset.target;
      const target = raw ? parseInt(raw, 10) : 0;
      if (target === 0) {
        el.textContent = "0";
        return;
      }
      let count = 0;
      const step = Math.ceil(target / 60);
      const timer = window.setInterval(() => {
        count = Math.min(count + step, target);
        el.textContent = String(count);
        if (count >= target) window.clearInterval(timer);
      }, 28);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          if (e.target.classList.contains("counter")) {
            startCounter(e.target as HTMLElement);
          }
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.12 }
    );

    root.querySelectorAll(".anim, .counter").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}
