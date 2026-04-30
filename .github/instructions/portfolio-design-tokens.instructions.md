---
description: "Use when editing portfolio UI, styling, pages, components, Tailwind classes, CSS variables, layout, navigation, footer, cards, links, or typography. Enforces the approved color token system and forbidden visual patterns."
name: "Portfolio Design Tokens"
applyTo: "src/**/*.{ts,tsx,css}"
---
# Portfolio Design Tokens

Use this design system consistently across all pages, sections, and components. Treat these as hard constraints unless the user explicitly approves changes.

## Approved Color Tokens

Define and use only these tokens:

- `--color-nav: #0D5C63` (navigation and primary actions)
- `--color-bg-primary: #F7F4EF` (default page background)
- `--color-bg-accent: #F0ECE3` (alternate sections, cards)
- `--color-bg-teal: #EEF8F8` (badges, subtle highlights)
- `--color-text-dark: #2B2B2B` (body and heading text on light backgrounds)
- `--color-text-light: #F2F2F2` (text on dark teal backgrounds)

Allowed supporting colors tied to existing usage:

- `--color-nav-hover: #0A4A50` (primary hover state)
- `--color-link-accent: #4AAFB7` (nav active/hover underline accent)
- `--color-footer-secondary: #a8d8db` (small footer text)
- `--color-card-border: rgba(13, 92, 99, 0.15)` (card and subtle divider border)

## Usage Rules

- Navigation:
- Background `#0D5C63`; nav text `#F2F2F2`.
- Hover/active link uses teal accent underline (`#4AAFB7`) or lighter teal treatment; no white underline.

- Page backgrounds:
- Default to `#F7F4EF`.
- Never use pure white (`#FFFFFF`) or pure black (`#000000`).

- Body text:
- On light surfaces, use `#2B2B2B`.
- Never use `#000000`.

- Alternate sections:
- Use `#F0ECE3` background and `#2B2B2B` text.

- Cards and project tiles:
- Background `#F7F4EF` or `#F0ECE3`.
- Border `1px solid rgba(13, 92, 99, 0.15)`.
- Card heading `#2B2B2B`.
- Tags/badges use `#EEF8F8` background and `#0D5C63` text.

- Buttons:
- Primary: background `#0D5C63`, text `#F2F2F2`.
- Primary hover: `#0A4A50`.
- Secondary/outline: border/text `#0D5C63`, transparent background.
- Secondary hover: `#EEF8F8`.

- Links:
- Default `#0D5C63`.
- Hover keeps same color with underline.

- Footer:
- Background `#0D5C63`.
- Main text `#F2F2F2`.
- Secondary text `#a8d8db`.

## Typography

- Headings: Playfair Display (or DM Serif Display if explicitly requested).
- Body: DM Sans (or Inter if explicitly requested).
- Fallback: `system-ui, sans-serif`.

## What To Avoid

- No pure white backgrounds.
- No pure black text.
- No gradients.
- No additional brand colors unless user-approved.
- No neon/high-saturation/clashing accents.

## Implementation Guidance

- Prefer CSS variables and token-based Tailwind arbitrary values over hardcoded utility color classes.
- If you find conflicting existing styles, refactor to token-based classes during the same change.
- If a requested design requires a new color, pause and ask for explicit approval before introducing it.
