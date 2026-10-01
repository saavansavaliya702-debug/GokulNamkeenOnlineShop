import { useEffect } from "react";

/**
 * Scroll-reveal observer with stagger + animated counters.
 * Re-runs when `dep` changes so elements mounted after data load
 * (products, etc.) also animate.
 */
export default function useScrollReveal(dep) {
  useEffect(() => {
    const timer = setTimeout(() => {
      /* ── Reveal observer ── */
      const els = document.querySelectorAll(
        ".gn-reveal:not(.is-visible), .gn-stagger:not(.is-visible)"
      );

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );

      els.forEach((el) => io.observe(el));

      /* ── Animated counters ── */
      const counters = document.querySelectorAll(
        ".stat-value[data-count]:not(.is-counted)"
      );
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add("is-counted");

            const raw = el.dataset.count;          // e.g. "20" or "50000"
            const suffix = el.dataset.suffix || ""; // e.g. "+" or "K+"
            const target = parseInt(raw, 10) || 0;
            const duration = 1400;
            const start = performance.now();

            const tick = (now) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent =
                Math.round(target * eased).toLocaleString("en-IN") + suffix;
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            cio.unobserve(el);
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((c) => cio.observe(c));

      return () => {
        io.disconnect();
        cio.disconnect();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [dep]);
}