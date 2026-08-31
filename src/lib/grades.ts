// APU (Asia Pacific University of Technology & Innovation, Malaysia) grading scheme.
// Sources cross-checked: Scholaro institution grading + APU GPA calculators.

export type Division = "Distinction" | "Merit" | "Pass" | "Fail";

export interface Grade {
  letter: string;
  point: number;
  min: number;
  max: number;
  division: Division;
}

export const GRADES: Grade[] = [
  { letter: "A+", point: 4.0, min: 80, max: 100, division: "Distinction" },
  { letter: "A", point: 3.7, min: 75, max: 79, division: "Distinction" },
  { letter: "B+", point: 3.3, min: 70, max: 74, division: "Merit" },
  { letter: "B", point: 3.0, min: 65, max: 69, division: "Merit" },
  { letter: "C+", point: 2.7, min: 60, max: 64, division: "Pass" },
  { letter: "C", point: 2.3, min: 55, max: 59, division: "Pass" },
  { letter: "C-", point: 2.0, min: 50, max: 54, division: "Pass" },
  { letter: "D", point: 1.7, min: 40, max: 49, division: "Fail" },
  { letter: "F+", point: 1.3, min: 30, max: 39, division: "Fail" },
  { letter: "F", point: 1.0, min: 20, max: 29, division: "Fail" },
  { letter: "F-", point: 0.0, min: 1, max: 19, division: "Fail" },
];

export const PASS_POINT = 2.0; // C- and above is a module pass at APU
export const MAX_POINT = 4.0;

export function pointFor(letter: string): number {
  return GRADES.find((g) => g.letter === letter)?.point ?? 0;
}

export interface Course {
  id: string;
  name: string;
  credit: string; // kept as string for controlled inputs
  grade: string;
}

export interface GpaResult {
  gpa: number;
  credits: number;
  quality: number;
  counted: number;
}

// Semester GPA from a list of courses (credit-weighted).
export function computeGpa(courses: Course[]): GpaResult {
  let credits = 0;
  let quality = 0;
  let counted = 0;
  for (const c of courses) {
    const cr = parseFloat(c.credit);
    if (!c.grade || !Number.isFinite(cr) || cr <= 0) continue;
    credits += cr;
    quality += cr * pointFor(c.grade);
    counted += 1;
  }
  return {
    gpa: credits > 0 ? quality / credits : 0,
    credits,
    quality,
    counted,
  };
}

// Cumulative CGPA folding in prior standing.
export function computeCgpa(
  sem: GpaResult,
  priorCgpa: number,
  priorCredits: number,
): { cgpa: number; totalCredits: number } {
  const pc = Number.isFinite(priorCredits) && priorCredits > 0 ? priorCredits : 0;
  const pg = Number.isFinite(priorCgpa) && priorCgpa >= 0 ? priorCgpa : 0;
  const totalCredits = pc + sem.credits;
  if (totalCredits <= 0) return { cgpa: 0, totalCredits: 0 };
  const cgpa = (pg * pc + sem.quality) / totalCredits;
  return { cgpa, totalCredits };
}

// Honours-style standing, indicative only.
export function classify(cgpa: number): { label: string; tone: Division } {
  if (cgpa >= 3.67) return { label: "First Class", tone: "Distinction" };
  if (cgpa >= 3.0) return { label: "Second Class (Upper)", tone: "Merit" };
  if (cgpa >= 2.5) return { label: "Second Class (Lower)", tone: "Merit" };
  if (cgpa >= 2.0) return { label: "Third Class", tone: "Pass" };
  return { label: "Below passing", tone: "Fail" };
}

export type Feasibility = "achieved" | "achievable" | "impossible" | "invalid";

export interface TargetResult {
  status: Feasibility;
  requiredGpa: number; // avg GPA needed next semester
  maxReachable: number; // best CGPA possible if you ace next semester
  neededLetter: string | null; // smallest grade whose avg would suffice
}

// "What do I need next semester to reach X?"
export function planTarget(
  currentCgpa: number,
  creditsDone: number,
  nextCredits: number,
  target: number,
): TargetResult {
  const cg = num(currentCgpa);
  const done = num(creditsDone);
  const next = num(nextCredits);
  const goal = num(target);

  if (next <= 0 || goal <= 0 || done < 0 || goal > MAX_POINT) {
    return { status: "invalid", requiredGpa: 0, maxReachable: 0, neededLetter: null };
  }

  const maxReachable = (cg * done + MAX_POINT * next) / (done + next);
  const requiredGpa = (goal * (done + next) - cg * done) / next;

  if (requiredGpa <= 0) {
    return { status: "achieved", requiredGpa: Math.max(requiredGpa, 0), maxReachable, neededLetter: null };
  }
  if (requiredGpa > MAX_POINT + 1e-9) {
    return { status: "impossible", requiredGpa, maxReachable, neededLetter: null };
  }
  return { status: "achievable", requiredGpa, maxReachable, neededLetter: letterForAverage(requiredGpa) };
}

// Smallest grade whose point clears the required average.
export function letterForAverage(gpa: number): string {
  const ascending = [...GRADES].reverse();
  for (const g of ascending) {
    if (g.point >= gpa - 1e-9) return g.letter;
  }
  return GRADES[0].letter;
}

function num(v: number): number {
  return Number.isFinite(v) ? v : 0;
}
