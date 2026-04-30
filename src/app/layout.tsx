import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal portfolio — projects, blog, and more.",
};

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/skills", label: "Skills" },
  { href: "/about", label: "About" },
  { href: "/education", label: "Education" },
  { href: "/interests", label: "Interests" },
  { href: "/resume", label: "Resume" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} antialiased`}
    >
      <body className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-dark)]">
        <header className="sticky top-0 z-10 border-b border-[var(--color-card-border)] bg-[var(--color-nav)]/95 backdrop-blur">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="nav-link-brand font-bold mr-4">
              Portfolio
            </Link>
            <NavLinks items={NAV} />
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-12">{children}</main>
        <footer className="border-t border-[var(--color-card-border)] mt-20 bg-[var(--color-nav)]">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-[var(--color-text-light)] text-sm">
            Built with Next.js · Hosted on GitHub Pages
            <p className="text-[var(--color-footer-secondary)] mt-1">Portfolio</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
