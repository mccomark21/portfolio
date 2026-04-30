# portfolio

A Next.js portfolio site showcasing projects, blog posts, and professional information. Built with MDX for dynamic content and Tailwind CSS for styling. Deployed as a static site to GitHub Pages.

## Tech Stack

- **Framework**: Next.js 16.2.4
- **Runtime**: React 19 with React DOM 19
- **Styling**: Tailwind CSS v4 (with PostCSS)
- **Content**: MDX (via next-mdx-remote v6)
- **Code Highlighting**: Shiki v4
- **Validation**: Zod v4
- **Type Safety**: TypeScript v5
- **Linting**: ESLint v9

## Project Structure

```
src/
  app/                    # App Router pages
    page.tsx            # Home page
    layout.tsx          # Root layout with navigation
    about/page.tsx      # About page
    blog/page.tsx       # Blog listing
    blog/[slug]/page.tsx # Blog post detail
    education/page.tsx  # Education page
    interests/page.tsx  # Interests page
    resume/page.tsx     # Resume page
    skills/page.tsx     # Skills page
  components/
    NavLinks.tsx        # Navigation component
    ProjectCard.tsx     # Project card component
    mdx/
      CodeBlock.tsx     # Syntax-highlighted code blocks
      MdxComponents.tsx # MDX component overrides
  lib/
    content/
      loaders.ts        # Content loading functions
      schemas.ts        # Zod schemas for frontmatter
      skills.ts         # Skills data utilities
    highlight.ts        # Shiki highlighting setup
content/
  pages/                # Static pages (About, Education, Interests)
    about.mdx
    education.mdx
    interests.mdx
  posts/                # Blog posts
  projects/             # Project cards (portfolio items)
  skills.json          # Skills manifest
  repos.json           # Watched repositories manifest
```

## Content Model

All content uses frontmatter (YAML) for metadata and MDX for body content.

### Blog Posts (`content/posts/*.mdx`)

```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
summary: "Brief description"
repoUrl: "https://..."           # Optional
techStack: ["Tech", "Stack"]      # Optional array
published: true                    # Required; hides unpublished posts
needsReview: false                # Optional review flag
---
```

### Projects (`content/projects/*.mdx`)

```yaml
---
title: "Project Name"
description: "Short description"
repoUrl: "https://..."            # Optional
blogSlug: "related-post-slug"     # Optional link to blog post
techStack: ["Tech", "Stack"]      # Optional array
featured: false                    # Optional; highlights on home page
---
```

### Static Pages (`content/pages/*.mdx`)

```yaml
---
title: "Page Title"
---
```

Pages are automatically mapped to routes:
- `about.mdx` → `/about`
- `education.mdx` → `/education`
- `interests.mdx` → `/interests`

### Skills Manifest (`content/skills.json`)

```json
{
  "generatedAt": "ISO 8601 timestamp",
  "categories": [
    {
      "category": "Category Name",
      "skills": [
        {
          "name": "Skill Name",
          "projects": ["project-slug-1", "project-slug-2"]
        }
      ]
    }
  ]
}
```

## npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Build static export to `out/` directory |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run validate:content` | Validate content schemas |

## Local Development

### Setup

```bash
npm install
npm run dev
```

Visit http://localhost:3000 (or http://localhost:3000/portfolio if using basePath).

### Validate Content

```bash
npm run validate:content
```

Validates all MDX files against Zod schemas. Run before committing content changes.

## Build & Deployment

### Static Export

The site is built as a static export:

```bash
npm run build
```

Output is written to `out/` directory.

### GitHub Pages Deployment

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`):

1. Pushes to `main` trigger a build
2. Next.js generates a static export to `out/`
3. Output is deployed to `gh-pages` branch
4. Site is served at `https://mccomark21.github.io/portfolio`

The `basePath` is set to `/portfolio` by default. To deploy to a custom domain root, set:

```bash
NEXT_PUBLIC_BASE_PATH="" npm run build
```

### Configuration

Key settings in `next.config.ts`:

- `output: "export"` — Static export mode
- `basePath: "/portfolio"` — GitHub Pages subpath (configurable via env var)
- `assetPrefix: basePath` — Correct asset paths for subpath
- `images.unoptimized: true` — Required for static export
- `trailingSlash: true` — Consistent URL routing

## Fonts

The site uses Google Fonts:

- **Body**: DM Sans
- **Headings**: Playfair Display

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`.

## Navigation

Main navigation is defined in `src/app/layout.tsx` and includes links to:
- Blog
- Skills
- About
- Education
- Interests
- Resume