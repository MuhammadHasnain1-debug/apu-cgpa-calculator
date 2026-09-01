"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import graduates from "./graduates.jpg";
import {
  GRADES,
  computeGpa,
  computeCgpa,
  classify,
  planTarget,
  PASS_POINT,
  type Course,
} from "@/lib/grades";

const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

const seedCourses: Course[] = [
  { id: "c1", name: "", credit: "", grade: "" },
  { id: "c2", name: "", credit: "", grade: "" },
  { id: "c3", name: "", credit: "", grade: "" },
];

function GradeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="np-input">
      <option value="">— grade —</option>
      {GRADES.map((g) => (
        <option key={g.letter} value={g.letter}>
          {g.letter} · {g.point.toFixed(1)}
        </option>
      ))}
    </select>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [mode, setMode] = useState<"calc" | "plan">("calc");

  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [usePrior, setUsePrior] = useState(false);
  const [priorCgpa, setPriorCgpa] = useState("");
  const [priorCredits, setPriorCredits] = useState("");
  const idRef = useRef(4);

  const [pCgpa, setPCgpa] = useState("3.00");
  const [pDone, setPDone] = useState("60");
  const [pNext, setPNext] = useState("18");
  const [pTarget, setPTarget] = useState("3.50");

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
    setDateStr(
      new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    );
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

  const setCourse = (id: string, patch: Partial<Course>) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCourse = () => setCourses((cs) => [...cs, { id: `c${idRef.current++}`, name: "", credit: "", grade: "" }]);
  const removeCourse = (id: string) => setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  const clearAll = () => {
    setCourses(seedCourses.map((c, i) => ({ ...c, id: `c${i + 1}` })));
    idRef.current = 4;
    setUsePrior(false);
    setPriorCgpa("");
    setPriorCredits("");
  };

  const sem = useMemo(() => computeGpa(courses), [courses]);
  const cum = useMemo(() => computeCgpa(sem, parseFloat(priorCgpa), parseFloat(priorCredits)), [sem, priorCgpa, priorCredits]);
  const shownCgpa = usePrior && cum.totalCredits > 0 ? cum.cgpa : sem.gpa;
  const shownCredits = usePrior && cum.totalCredits > 0 ? cum.totalCredits : sem.credits;
  const standing = classify(shownCgpa);
  const plan = useMemo(
    () => planTarget(parseFloat(pCgpa), parseFloat(pDone), parseFloat(pNext), parseFloat(pTarget)),
    [pCgpa, pDone, pNext, pTarget],
  );

  const verdict =
    plan.status === "achievable" ? "Achievable" :
    plan.status === "achieved" ? "Locked In" :
    plan.status === "impossible" ? "Out of Reach" : "—";

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      {/* top matter */}
      <div className="flex items-center justify-between kicker">
        <span>Vol. IV · No. 26</span>
        <span suppressHydrationWarning className="hidden sm:inline">{dateStr}</span>
        <button onClick={toggleTheme} className="underline decoration-1 underline-offset-2 hover:opacity-70">
          <span suppressHydrationWarning>{mounted && dark ? "Day Edition" : "Night Edition"}</span>
        </button>
      </div>
      <div className="rule-2 mt-2" />

      {/* masthead */}
      <header className="pt-4 text-center">
        <div className="plate text-5xl leading-none sm:text-7xl">The Grade Gazette</div>
        <div className="double-rule mt-3 pt-1" />
        <div className="flex items-center justify-between kicker py-1">
          <span>Asia Pacific University</span>
          <span className="smallcaps hidden sm:inline" style={{ fontStyle: "italic" }}>Numeris Veritas</span>
          <span>Price · Free</span>
        </div>
        <div className="rule" />
      </header>

      {/* front page: lede + photo */}
      <section className="grid gap-6 py-6 md:grid-cols-[1.35fr_1fr]">
        <div className="ink-in">
          <p className="kicker">Results Day · Special Report</p>
          <h1 className="head mt-1 text-3xl font-black leading-[1.05] sm:text-[2.7rem]">
            Know Your Standing.<br />Plan Your Target.
          </h1>
          <p className="dropcap mt-3 text-[0.98rem]">
            Enter your modules and credits below to read off your semester GPA and cumulative CGPA on
            Asia Pacific University&rsquo;s official grade scale. Then turn to the Forecast Desk to learn
            precisely what grades next semester would carry you to the CGPA you are chasing.
          </p>
          <p className="mt-3 italic text-[var(--muted)]">— By the Registrar&rsquo;s Desk</p>
        </div>
        <figure className="develop self-start">
          <img
            src={graduates.src}
            width={graduates.width}
            height={graduates.height}
            alt="Graduates toss their caps at an Asia Pacific University commencement."
            className="paper-photo w-full"
          />
          <figcaption className="kicker mt-1 border-t border-[var(--faint)] pt-1" style={{ textTransform: "none", letterSpacing: 0 }}>
            <span className="italic">The Class of 2026 mark results day.</span> — Gazette staff photo
          </figcaption>
        </figure>
      </section>

      {/* section switcher */}
      <div className="rule-2" />
      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2.5 text-center">
        <span className="kicker">Today&rsquo;s Sections:</span>
        {([["calc", "The Results Desk"], ["plan", "The Forecast Desk"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`head text-lg transition ${mode === key ? "font-black underline decoration-2 underline-offset-4" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="rule-2" />

      {/* print-roller sweep on section change */}
      <div key={`roll-${mode}`} className="roller" aria-hidden />

      {/* the section, reprinted */}
      <div key={mode} className="reprint pt-7">
        <div key={`h-${mode}`} className="stamp mb-6 text-center">
          <p className="kicker">{mode === "calc" ? "Section A" : "Section B"} · Edition of the Day</p>
          <h2 className="head text-4xl font-black sm:text-5xl">
            {mode === "calc" ? "The Results Desk" : "The Forecast Desk"}
          </h2>
          <p className="italic text-[var(--muted)]">
            {mode === "calc"
              ? "Your grades, tallied and weighted by credit."
              : "The arithmetic of ambition — what next semester must deliver."}
          </p>
        </div>

        {mode === "calc" ? (
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
            {/* entry column */}
            <section>
              <label className="mb-4 flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={usePrior} onChange={(e) => setUsePrior(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
                <span className="kicker" style={{ fontSize: "0.72rem" }}>Carry forward previous semesters</span>
              </label>

              {usePrior && (
                <div className="ink-in mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="kicker mb-1 block">Standing CGPA</label>
                    <input inputMode="decimal" value={priorCgpa} onChange={(e) => setPriorCgpa(e.target.value)} placeholder="e.g. 3.25" className="np-input" />
                  </div>
                  <div>
                    <label className="kicker mb-1 block">Credits earned</label>
                    <input inputMode="numeric" value={priorCredits} onChange={(e) => setPriorCredits(e.target.value)} placeholder="e.g. 60" className="np-input" />
                  </div>
                </div>
              )}

              <div className="mb-2 grid grid-cols-[1fr_66px_120px_28px] items-end gap-3">
                <span className="kicker">Module</span>
                <span className="kicker text-center">Credit</span>
                <span className="kicker">Grade</span>
                <span />
              </div>
              <div className="rule mb-1" />
              <div>
                {courses.map((c) => (
                  <div key={c.id} className="grid grid-cols-[1fr_66px_120px_28px] items-center gap-3 border-b border-[var(--faint)] py-1.5">
                    <input value={c.name} onChange={(e) => setCourse(c.id, { name: e.target.value })} placeholder="module name (optional)" className="np-input" style={{ borderBottom: 0 }} />
                    <input inputMode="decimal" value={c.credit} onChange={(e) => setCourse(c.id, { credit: e.target.value })} placeholder="cr" className="np-input text-center" style={{ borderBottom: 0 }} />
                    <GradeSelect value={c.grade} onChange={(v) => setCourse(c.id, { grade: v })} />
                    <button onClick={() => removeCourse(c.id)} aria-label="Strike module" className="head text-lg text-[var(--muted)] hover:text-[var(--ink)]">×</button>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-5">
                <button onClick={addCourse} className="head font-bold underline decoration-2 underline-offset-4 hover:opacity-70">＋ Add a module</button>
                <button onClick={clearAll} className="kicker hover:text-[var(--ink)]">Clear the page</button>
              </div>
            </section>

            {/* standing box */}
            <aside className="md:sticky md:top-5 h-fit ink-box p-6 text-center">
              <p className="kicker">{usePrior && cum.totalCredits > 0 ? "Cumulative CGPA" : "Semester GPA"}</p>
              <div className="double-rule mx-auto mt-2 w-16" />
              <div className="head my-2 text-7xl font-black tabular-nums">{fmt(shownCgpa)}</div>
              <p className="kicker">out of a possible 4.00</p>

              <div className="rule-2 my-4" />
              {sem.counted > 0 ? (
                <p className="head text-2xl font-black smallcaps">{standing.label}</p>
              ) : (
                <p className="italic text-[var(--muted)]">Awaiting the first credit &amp; grade…</p>
              )}

              <div className="mt-5 grid grid-cols-2 divide-x divide-[var(--faint)] border-t border-[var(--faint)] pt-4">
                <div>
                  <div className="head text-2xl font-black tabular-nums">{shownCredits || 0}</div>
                  <div className="kicker mt-1">Credits</div>
                </div>
                <div>
                  <div className="head text-2xl font-black tabular-nums">{sem.counted}</div>
                  <div className="kicker mt-1">Modules</div>
                </div>
              </div>
              {usePrior && cum.totalCredits > 0 && (
                <p className="kicker mt-4 border-t border-[var(--faint)] pt-3">This semester alone · {fmt(sem.gpa)}</p>
              )}
            </aside>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
            {/* forecast inputs */}
            <section>
              <p className="dropcap mb-5 text-[0.98rem]">
                Every target is just arithmetic once you know your standing. Give the desk four figures and it
                will report the average you must post next semester &mdash; and whether the number can be reached at all.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="kicker mb-1 block">Current CGPA</label>
                  <input inputMode="decimal" value={pCgpa} onChange={(e) => setPCgpa(e.target.value)} className="np-input" />
                </div>
                <div>
                  <label className="kicker mb-1 block">Credits completed</label>
                  <input inputMode="numeric" value={pDone} onChange={(e) => setPDone(e.target.value)} className="np-input" />
                </div>
                <div>
                  <label className="kicker mb-1 block">Credits next semester</label>
                  <input inputMode="numeric" value={pNext} onChange={(e) => setPNext(e.target.value)} className="np-input" />
                </div>
                <div>
                  <label className="kicker mb-1 block">Target CGPA</label>
                  <input inputMode="decimal" value={pTarget} onChange={(e) => setPTarget(e.target.value)} className="np-input" />
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="kicker">Set your ambition</span>
                  <span className="head font-black tabular-nums">{fmt(parseFloat(pTarget) || 0)}</span>
                </div>
                <input type="range" min={0} max={4} step={0.05} value={parseFloat(pTarget) || 0} onChange={(e) => setPTarget(e.target.value)} className="w-full" />
                <div className="kicker mt-1 flex justify-between"><span>0.00</span><span>2.00</span><span>4.00</span></div>
              </div>
            </section>

            {/* forecast verdict */}
            <aside className="md:sticky md:top-5 h-fit ink-box p-6 text-center">
              {plan.status === "invalid" ? (
                <p className="py-8 italic text-[var(--muted)]">The desk needs valid figures — a target between 0 and 4, and next-semester credits above zero.</p>
              ) : (
                <>
                  <p className="kicker">{plan.status === "achieved" ? "Already secured" : "Average required next semester"}</p>
                  <div className="double-rule mx-auto mt-2 w-16" />
                  <div className="head my-2 text-7xl font-black tabular-nums">
                    {plan.status === "impossible" ? "—" : fmt(Math.max(plan.requiredGpa, 0))}
                  </div>
                  <p className="kicker">grade-point average</p>
                  <div className="rule-2 my-4" />
                  <p className="head text-3xl font-black smallcaps">{verdict}</p>

                  <p key={`v-${mode}-${plan.status}`} className="stamp mt-3 text-[0.95rem]">
                    {plan.status === "achievable" && (
                      <>Post about <b>{fmt(plan.requiredGpa)}</b> across your next <b>{parseFloat(pNext) || 0}</b> credits — roughly {/^[AF]/.test(plan.neededLetter ?? "") ? "an" : "a"} <b>{plan.neededLetter}</b> in every module — to reach <b>{fmt(parseFloat(pTarget) || 0)}</b>.</>
                    )}
                    {plan.status === "achieved" && (
                      <>You clear <b>{fmt(parseFloat(pTarget) || 0)}</b> even after a poor semester. Aim higher — your ceiling is <b>{fmt(plan.maxReachable)}</b>.</>
                    )}
                    {plan.status === "impossible" && (
                      <>Even a straight-A+ semester tops out at <b>{fmt(plan.maxReachable)}</b>. Lower the target or spread it over more semesters.</>
                    )}
                  </p>

                  <p className="kicker mt-4 border-t border-[var(--faint)] pt-3">Best possible next semester · {fmt(plan.maxReachable)}</p>
                </>
              )}
            </aside>
          </div>
        )}
      </div>

      {/* grade reference */}
      <section className="mt-12">
        <div className="rule-2" />
        <h3 className="head py-2 text-center text-xl font-black smallcaps">The APU Grade Scale — For the Record</h3>
        <div className="rule mb-4" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3">
          {GRADES.map((g) => (
            <div key={g.letter} className="flex items-baseline justify-between border-b border-[var(--faint)] py-1.5">
              <span className="head font-black">{g.letter}</span>
              <span className="text-[var(--muted)] text-sm">{g.min}–{g.max}</span>
              <span className={`head font-black tabular-nums ${g.point >= PASS_POINT ? "" : "text-[var(--muted)]"}`}>{g.point.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <p className="kicker mt-3" style={{ textTransform: "none", letterSpacing: 0 }}>
          <span className="italic">Note.</span> C&minus; (2.0) and above is a module pass. The CGPA is the credit-weighted average of grade points.
        </p>
      </section>

      {/* colophon */}
      <footer className="mt-12 text-center">
        <div className="double-rule" />
        <p className="kicker mt-3" style={{ textTransform: "none", letterSpacing: 0 }}>
          <span className="smallcaps" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>The Grade Gazette</span> is an unofficial student tool, not affiliated with Asia Pacific University. Always confirm against your official transcript.
        </p>
        <p className="kicker mt-1">Set &amp; printed by Muhammad Hasnain · Every figure stays in your browser</p>
      </footer>
    </div>
  );
}
