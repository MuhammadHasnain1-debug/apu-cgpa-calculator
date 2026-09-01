import type { Metadata, Viewport } from "next";
import { Playfair_Display, PT_Serif, UnifrakturCook } from "next/font/google";
import "./globals.css";

const head = Playfair_Display({
  variable: "--font-head",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  style: ["normal", "italic"],
});
const body = PT_Serif({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const nameplate = UnifrakturCook({
  variable: "--font-plate",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "APU CGPA Calculator — The Grade Gazette",
  description:
    "A CGPA calculator and grade planner for Asia Pacific University (APU) students, set like a broadsheet newspaper. Work out your semester GPA and cumulative CGPA, and plan what you need next semester to hit a target.",
  keywords: ["APU CGPA calculator", "Asia Pacific University", "GPA calculator", "CGPA", "grade planner"],
  openGraph: {
    title: "APU CGPA Calculator — The Grade Gazette",
    description: "Calculate your APU GPA and CGPA, and plan what you need next semester to reach your target.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#f3efe4" };

const themeInit = `(function(){try{var t=localStorage.getItem('apu-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${head.variable} ${body.variable} ${nameplate.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
