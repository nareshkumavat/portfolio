/* =========================================================
   NARESH KUMAVAT — interaction layer
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- boot ---------- */
  const boot = $("#boot");
  const bootBar = $("#bootBar");
  const bootPct = $("#bootPct");
  let p = 0;

  const bootTick = setInterval(() => {
    p = Math.min(100, p + Math.random() * 16 + 6);
    bootBar.style.width = p + "%";
    bootPct.textContent = String(Math.floor(p)).padStart(3, "0") + "%";
    if (p >= 100) {
      clearInterval(bootTick);
      setTimeout(() => {
        boot.classList.add("is-done");
        document.body.classList.add("is-loaded");
        setTimeout(() => boot.remove(), 800);
      }, 380);
    }
  }, 120);

  if (reduced) {
    clearInterval(bootTick);
    boot.remove();
    document.body.classList.add("is-loaded");
  }

  /* ---------- particle field ---------- */
  const canvas = $("#field");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let dots = [];
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(110, Math.floor((w * h) / 16000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.5 + 0.4,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.x += d.vx;
        d.y += d.vy;

        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        /* mouse repulsion */
        const dxm = d.x - mouse.x;
        const dym = d.y - mouse.y;
        const distM = Math.hypot(dxm, dym);
        if (distM < 130 && distM > 0) {
          d.x += (dxm / distM) * 0.7;
          d.y += (dym / distM) * 0.7;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(201, 255, 61, 0.55)";
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const o = dots[j];
          const dist = Math.hypot(d.x - o.x, d.y - o.y);
          if (dist < 118) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = `rgba(201, 255, 61, ${0.11 * (1 - dist / 118)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };

    build();
    draw();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 180);
    });
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });
  }

  /* ---------- glow cursor ---------- */
  const glow = $("#glowCursor");
  if (glow && window.matchMedia("(hover: hover)").matches) {
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const follow = () => {
      gx += (tx - gx) * 0.09;
      gy += (ty - gy) * 0.09;
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- scrollbar + topbar ---------- */
  const bar = $("#scrollbar");
  const topbar = $(".topbar");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    topbar.classList.toggle("is-scrolled", window.scrollY > 30);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- menu ---------- */
  const toggle = $("#toggle");
  const menu = $("#menu");
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  });
  $$(".menu__link").forEach((l) =>
    l.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
    })
  );

  /* ---------- active link ---------- */
  const sections = $$("main section[id]");
  const map = new Map($$(".menu__link").map((l) => [l.getAttribute("href").slice(1), l]));
  const navObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        map.forEach((l) => l.classList.remove("is-active"));
        map.get(e.target.id)?.classList.add("is-active");
      });
    },
    { rootMargin: "-40% 0px -52% 0px" }
  );
  sections.forEach((s) => navObs.observe(s));

  /* ---------- reveal ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add("is-in"), i * 80);
        revealObs.unobserve(entry.target);
        if (entry.target.classList.contains("numbers")) countUp(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -50px 0px" }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- counters ---------- */
  function countUp(scope) {
    $$("[data-count]", scope).forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const start = performance.now();
      const dur = 1500;
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(dec);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(dec);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- magnetic ---------- */
  if (window.matchMedia("(hover: hover)").matches && !reduced) {
    $$("[data-magnet]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.16;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = "translate(0,0)"));
    });

    /* ---------- tilt + spotlight ---------- */
    $$("[data-tilt]").forEach((el) => {
      const amt = el.classList.contains("proj") ? 2.5 : 4;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * amt}deg) rotateY(${(px - 0.5) * amt}deg) translateY(-3px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- typer ---------- */
  const typer = $("#typer");
  if (typer && !reduced) {
    const phrases = [
      "building privacy-first tools",
      "analysing data that matters",
      "shipping with AI in the loop",
      "learning in public",
    ];
    let pi = 0, ci = 0, deleting = false;

    const type = () => {
      const phrase = phrases[pi];
      ci += deleting ? -1 : 1;
      typer.textContent = phrase.slice(0, ci);

      let delay = deleting ? 32 : 55;
      if (!deleting && ci === phrase.length) { delay = 2100; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 380; }

      setTimeout(type, delay);
    };
    setTimeout(type, 2200);
  }

  /* ---------- email copy ---------- */
  const mail = $(".contact__mail");
  if (mail) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = "EMAIL COPIED — TALK SOON";
    document.body.appendChild(toast);

    mail.addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText("nareshkumavaty@gmail.com");
        e.preventDefault();
        toast.classList.add("is-on");
        setTimeout(() => toast.classList.remove("is-on"), 2200);
      } catch {
        /* default mailto */
      }
    });
  }

  /* ---------- year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
