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
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/resume", label: "Resume" },
  { href: "/about", label: "About" },
];

/**
 * Contact links. The site publishes no email address and has no contact form.
 * The footer and /about render these links.
 */
export const SOCIAL_LINKS: NavRoute[] = [
  { href: "https://www.linkedin.com/in/mark-mccomisky/", label: "LinkedIn" },
  { href: "https://github.com/mccomark21", label: "GitHub" },
];

export const SITE_METADATA = {
  title: "Portfolio",
  description: "Personal portfolio — projects, writing, and more.",
};
