/**
 * Single source of truth for site-level constants.
 * layout.tsx, any future sitemap, robots, or breadcrumb module should import from here.
 * Adding a new route: add one entry to NAV_ROUTES — nothing else required.
 */

export interface NavRoute {
  href: string;
  label: string;
}

export const NAV_ROUTES: NavRoute[] = [
  { href: "/blog", label: "Blog" },
  { href: "/skills", label: "Skills" },
  { href: "/about", label: "About" },
  { href: "/education", label: "Education" },
  { href: "/interests", label: "Interests" },
  { href: "/resume", label: "Resume" },
];

export const SITE_METADATA = {
  title: "Portfolio",
  description: "Personal portfolio — projects, blog, and more.",
};
