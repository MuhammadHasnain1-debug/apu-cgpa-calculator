"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GRADES,
  computeGpa,
  computeCgpa,
  classify,
  planTarget,
  PASS_POINT,
  type Course,
} from "@/lib/grades";

/* ---------------- small pieces ---------------- */

const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

function Ring({
  value,
  max = 4,
  size = 176,
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  children: React.ReactNode;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" className="stroke-slate-300/40 dark:stroke-white/10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,.61,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--card-border)] bg-white/60 dark:bg-white/[0.04] px-3 py-2.5 text-sm outline-none transition focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/10 placeholder:text-slate-400 dark:placeholder:text-slate-500";

function GradeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} pr-8 cursor-pointer`}>
        <option value="">Grade</option>
        {GRADES.map((g) => (
          <option key={g.letter} value={g.letter}>
            {g.letter} · {g.point.toFixed(1)}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    Distinction: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 border-indigo-500/25",
    Merit: "bg-violet-500/12 text-violet-600 dark:text-violet-300 border-violet-500/25",
    Pass: "bg-amber-500/12 text-amber-600 dark:text-amber-300 border-amber-500/25",
    Fail: "bg-rose-500/12 text-rose-600 dark:text-rose-300 border-rose-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] ?? tones.Pass}`}>
      {children}
    </span>
  );
}

/* ---------------- page ---------------- */

const seedCourses: Course[] = [
  { id: "c1", name: "", credit: "", grade: "" },
  { id: "c2", name: "", credit: "", grade: "" },
  { id: "c3", name: "", credit: "", grade: "" },
];

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [mode, setMode] = useState<"calc" | "plan">("calc");

  // calculator state
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [usePrior, setUsePrior] = useState(false);
  const [priorCgpa, setPriorCgpa] = useState("");
  const [priorCredits, setPriorCredits] = useState("");
  const idRef = useRef(4);

  // planner state
  const [pCgpa, setPCgpa] = useState("3.00");
  const [pDone, setPDone] = useState("60");
  const [pNext, setPNext] = useState("18");
  const [pTarget, setPTarget] = useState("3.50");

  /* hydrate from localStorage after mount */
  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
    try {
      const c = localStorage.getItem("apu-courses");
      if (c) {
        const parsed = JSON.parse(c) as Course[];
        if (Array.isArray(parsed) && parsed.length) {
          setCourses(parsed);
          idRef.current = parsed.length + 1;
        }
      }
      const p = localStorage.getItem("apu-prior");
      if (p) {
        const o = JSON.parse(p);
        setUsePrior(!!o.enabled);
        setPriorCgpa(o.cgpa ?? "");
        setPriorCredits(o.credits ?? "");
      }
      const pl = localStorage.getItem("apu-plan");
      if (pl) {
        const o = JSON.parse(pl);
        setPCgpa(o.cgpa ?? "3.00");
        setPDone(o.done ?? "60");
        setPNext(o.next ?? "18");
        setPTarget(o.target ?? "3.50");
      }
    } catch {}
  }, []);

  /* persist */
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("apu-courses", JSON.stringify(courses));
      localStorage.setItem("apu-prior", JSON.stringify({ enabled: usePrior, cgpa: priorCgpa, credits: priorCredits }));
    } catch {}
  }, [courses, usePrior, priorCgpa, priorCredits, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("apu-plan", JSON.stringify({ cgpa: pCgpa, done: pDone, next: pNext, target: pTarget }));
    } catch {}
  }, [pCgpa, pDone, pNext, pTarget, mounted]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("apu-theme", next ? "dark" : "light");
    } catch {}
  }

  /* course ops */
  const setCourse = (id: string, patch: Partial<Course>) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCourse = () =>
    setCourses((cs) => [...cs, { id: `c${idRef.current++}`, name: "", credit: "", grade: "" }]);
  const removeCourse = (id: string) =>
    setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  const clearAll = () => {
    setCourses(seedCourses.map((c, i) => ({ ...c, id: `c${i + 1}` })));
    idRef.current = 4;
    setUsePrior(false);
    setPriorCgpa("");
    setPriorCredits("");
  };

  /* computed */
  const sem = useMemo(() => computeGpa(courses), [courses]);
  const cum = useMemo(
    () => computeCgpa(sem, parseFloat(priorCgpa), parseFloat(priorCredits)),
    [sem, priorCgpa, priorCredits],
  );
  const shownCgpa = usePrior && cum.totalCredits > 0 ? cum.cgpa : sem.gpa;
  const shownCredits = usePrior && cum.totalCredits > 0 ? cum.totalCredits : sem.credits;
  const standing = classify(shownCgpa);

  const plan = useMemo(
    () => planTarget(parseFloat(pCgpa), parseFloat(pDone), parseFloat(pNext), parseFloat(pTarget)),
    [pCgpa, pDone, pNext, pTarget],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      {/* header */}
      <header className="flex items-center justify-between gap-4 py-6 sm:py-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5" />
              <path d="M22 10v6" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight sm:text-xl">
              APU <span className="grad-text">CGPA</span> Calculator
            </h1>
            <p className="muted text-xs">Asia Pacific University · plan your grades</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--card-border)] glass transition hover:scale-105 active:scale-95"
        >
          {mounted && dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
      </header>

      {/* hero line */}
      <div className="mb-6 max-w-2xl rise">
        <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Know your CGPA. <span className="grad-text">Plan your target.</span>
        </h2>
        <p className="muted mt-2 text-sm sm:text-base">
          Enter your modules and credits to get your GPA and cumulative CGPA — then flip to the planner to
          see exactly what you need next semester to hit the CGPA you want.
        </p>
      </div>

      {/* mode tabs */}
      <div className="mb-6 inline-flex rounded-2xl border border-[var(--card-border)] glass p-1">
        {([["calc", "CGPA Calculator"], ["plan", "Target Planner"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === key
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-violet-500/25"
                : "muted hover:text-[var(--text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "calc" ? (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* inputs */}
          <section className="glass rounded-3xl p-5 sm:p-6">
            {/* prior toggle */}
            <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--card-border)] bg-white/40 dark:bg-white/[0.03] px-4 py-3">
              <span>
                <span className="text-sm font-semibold">Include previous semesters</span>
                <span className="muted block text-xs">Add prior CGPA to get your cumulative standing</span>
              </span>
              <span className="relative inline-block">
                <input type="checkbox" checked={usePrior} onChange={(e) => setUsePrior(e.target.checked)} className="peer sr-only" />
                <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-violet-500 dark:bg-white/15" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>

            {usePrior && (
              <div className="mb-5 grid grid-cols-2 gap-3 pop">
                <div>
                  <label className="muted mb-1 block text-xs font-medium">Current CGPA</label>
                  <input inputMode="decimal" value={priorCgpa} onChange={(e) => setPriorCgpa(e.target.value)} placeholder="e.g. 3.25" className={inputCls} />
                </div>
                <div>
                  <label className="muted mb-1 block text-xs font-medium">Credits completed</label>
                  <input inputMode="numeric" value={priorCredits} onChange={(e) => setPriorCredits(e.target.value)} placeholder="e.g. 60" className={inputCls} />
                </div>
              </div>
            )}

            {/* course header */}
            <div className="mb-2 grid grid-cols-[1fr_72px_110px_36px] items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide muted">
              <span>Module</span>
              <span className="text-center">Credit</span>
              <span>Grade</span>
              <span />
            </div>

            <div className="space-y-2">
              {courses.map((c) => (
                <div key={c.id} className="grid grid-cols-[1fr_72px_110px_36px] items-center gap-2">
                  <input value={c.name} onChange={(e) => setCourse(c.id, { name: e.target.value })} placeholder="Module name (optional)" className={inputCls} />
                  <input inputMode="decimal" value={c.credit} onChange={(e) => setCourse(c.id, { credit: e.target.value })} placeholder="Cr" className={`${inputCls} text-center`} />
                  <GradeSelect value={c.grade} onChange={(v) => setCourse(c.id, { grade: v })} />
                  <button
                    onClick={() => removeCourse(c.id)}
                    aria-label="Remove module"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--card-border)] muted transition hover:border-rose-400/50 hover:text-rose-500"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={addCourse} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:brightness-110 active:scale-95">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Add module
              </button>
              <button onClick={clearAll} className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-semibold muted transition hover:text-[var(--text)]">
                Reset
              </button>
            </div>
          </section>

          {/* result */}
          <section className="lg:sticky lg:top-6 h-fit glass rounded-3xl p-6 text-center">
            <p className="muted text-xs font-semibold uppercase tracking-widest">
              {usePrior && cum.totalCredits > 0 ? "Cumulative CGPA" : "Semester GPA"}
            </p>
            <div className="my-4 grid place-items-center">
              <Ring value={shownCgpa}>
                <div>
                  <div className="grad-text text-4xl font-extrabold tabular-nums">{fmt(shownCgpa)}</div>
                  <div className="muted text-[11px] font-semibold">out of 4.00</div>
                </div>
              </Ring>
            </div>

            {sem.counted > 0 ? (
              <StatusPill tone={standing.tone}>{standing.label}</StatusPill>
            ) : (
              <p className="muted text-sm">Add a credit and grade to begin</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl border border-[var(--card-border)] bg-white/40 dark:bg-white/[0.03] p-3">
                <div className="muted text-[11px] font-semibold uppercase">Total credits</div>
                <div className="text-xl font-bold tabular-nums">{shownCredits || 0}</div>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-white/40 dark:bg-white/[0.03] p-3">
                <div className="muted text-[11px] font-semibold uppercase">Modules</div>
                <div className="text-xl font-bold tabular-nums">{sem.counted}</div>
              </div>
              {usePrior && cum.totalCredits > 0 && (
                <div className="col-span-2 rounded-2xl border border-[var(--card-border)] bg-white/40 dark:bg-white/[0.03] p-3">
                  <div className="muted text-[11px] font-semibold uppercase">This semester GPA</div>
                  <div className="text-xl font-bold tabular-nums">{fmt(sem.gpa)}</div>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* planner inputs */}
          <section className="glass rounded-3xl p-5 sm:p-6">
            <h3 className="text-base font-bold">What do I need next semester?</h3>
            <p className="muted mt-1 text-sm">Tell us where you stand and where you want to be.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="muted mb-1 block text-xs font-semibold uppercase tracking-wide">Current CGPA</label>
                <input inputMode="decimal" value={pCgpa} onChange={(e) => setPCgpa(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="muted mb-1 block text-xs font-semibold uppercase tracking-wide">Credits completed</label>
                <input inputMode="numeric" value={pDone} onChange={(e) => setPDone(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="muted mb-1 block text-xs font-semibold uppercase tracking-wide">Credits next semester</label>
                <input inputMode="numeric" value={pNext} onChange={(e) => setPNext(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="muted mb-1 block text-xs font-semibold uppercase tracking-wide">Target CGPA</label>
                <input inputMode="decimal" value={pTarget} onChange={(e) => setPTarget(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="muted uppercase tracking-wide">Target CGPA</span>
                <span className="grad-text text-sm">{fmt(parseFloat(pTarget) || 0)}</span>
              </div>
              <input
                type="range" min={0} max={4} step={0.05}
                value={parseFloat(pTarget) || 0}
                onChange={(e) => setPTarget(e.target.value)}
                className="w-full"
                style={{ accentColor: "#a855f7" }}
              />
              <div className="muted mt-1 flex justify-between text-[10px]">
                <span>0.00</span><span>2.00</span><span>4.00</span>
              </div>
            </div>
          </section>

          {/* planner result */}
          <section className="lg:sticky lg:top-6 h-fit glass rounded-3xl p-6 text-center">
            {plan.status === "invalid" ? (
              <div className="py-6">
                <p className="muted text-sm">Fill in valid numbers (target must be between 0 and 4, and next-semester credits above 0).</p>
              </div>
            ) : (
              <>
                <p className="muted text-xs font-semibold uppercase tracking-widest">
                  {plan.status === "achieved" ? "You're already there" : "Average you need next sem"}
                </p>
                <div className="my-4 grid place-items-center">
                  <Ring value={plan.status === "achieved" ? parseFloat(pTarget) || 0 : Math.min(plan.requiredGpa, 4)}>
                    <div>
                      <div className="grad-text text-4xl font-extrabold tabular-nums">
                        {plan.status === "impossible" ? "—" : fmt(Math.max(plan.requiredGpa, 0))}
                      </div>
                      <div className="muted text-[11px] font-semibold">GPA needed</div>
                    </div>
                  </Ring>
                </div>

                {plan.status === "achievable" && (
                  <div className="pop">
                    <StatusPill tone="Merit">Achievable</StatusPill>
                    <p className="mt-3 text-sm">
                      Average <b className="grad-text">{fmt(plan.requiredGpa)}</b> across your next{" "}
                      <b>{parseFloat(pNext) || 0}</b> credits — roughly{" "}
                      {/^[AF]/.test(plan.neededLetter ?? "") ? "an" : "a"}{" "}
                      <b>{plan.neededLetter}</b> in every module — to reach{" "}
                      <b>{fmt(parseFloat(pTarget) || 0)}</b>.
                    </p>
                  </div>
                )}
                {plan.status === "achieved" && (
                  <div className="pop">
                    <StatusPill tone="Distinction">Locked in</StatusPill>
                    <p className="mt-3 text-sm">
                      You&apos;ll clear <b>{fmt(parseFloat(pTarget) || 0)}</b> even in a rough semester. Aim high anyway — your ceiling is{" "}
                      <b className="grad-text">{fmt(plan.maxReachable)}</b>.
                    </p>
                  </div>
                )}
                {plan.status === "impossible" && (
                  <div className="pop">
                    <StatusPill tone="Fail">Out of reach</StatusPill>
                    <p className="mt-3 text-sm">
                      Even a straight-A+ semester tops out at{" "}
                      <b className="grad-text">{fmt(plan.maxReachable)}</b>. Set a target at or below that, or
                      spread it over more semesters.
                    </p>
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-[var(--card-border)] bg-white/40 dark:bg-white/[0.03] p-3 text-left">
                  <div className="muted text-[11px] font-semibold uppercase">Best possible CGPA next sem</div>
                  <div className="text-xl font-bold tabular-nums">{fmt(plan.maxReachable)}</div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* grade scale reference */}
      <details className="group mt-8 glass rounded-3xl p-5 sm:p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <span className="font-bold">APU grading scale</span>
          <svg className="muted transition group-open:rotate-180" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {GRADES.map((g) => (
            <div key={g.letter} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-white/40 dark:bg-white/[0.03] px-3 py-2">
              <div>
                <div className="font-bold">{g.letter} <span className="muted text-xs font-normal">· {g.min}–{g.max}</span></div>
                <div className="muted text-[11px]">{g.division}</div>
              </div>
              <div className={`text-lg font-extrabold tabular-nums ${g.point >= PASS_POINT ? "grad-text" : "muted"}`}>{g.point.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <p className="muted mt-3 text-xs">C− (2.0) and above is a module pass. Grade points are credit-weighted to give your GPA and CGPA.</p>
      </details>

      {/* footer */}
      <footer className="mt-10 flex flex-col items-center gap-1 text-center">
        <p className="muted text-xs">
          Unofficial student tool · not affiliated with Asia Pacific University. Always confirm with your APCard / official transcript.
        </p>
        <p className="muted text-xs">Built by Muhammad Hasnain · runs entirely in your browser, no data leaves this page.</p>
      </footer>
    </div>
  );
}
