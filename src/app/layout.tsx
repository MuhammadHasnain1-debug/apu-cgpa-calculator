import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "APU CGPA Calculator — plan your grades",
  description:
    "A clean CGPA calculator for Asia Pacific University (APU) students. Work out your semester GPA and cumulative CGPA, and plan the grades you need next semester to hit a target.",
  keywords: [
    "APU CGPA calculator",
    "Asia Pacific University",
    "GPA calculator",
    "CGPA",
    "grade planner",
  ],
  openGraph: {
    title: "APU CGPA Calculator",
    description:
      "Calculate your APU GPA and CGPA, and plan what you need next semester to reach your target.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b16",
};

const themeInit = `(function(){try{var t=localStorage.getItem('apu-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
