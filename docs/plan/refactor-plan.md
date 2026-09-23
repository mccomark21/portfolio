# Portfolio v2 — Refactor Plan

Status: decisions recorded 2026-09-23. Ready to convert into GitHub issues.
Baseline: Next.js 16.2.4 static export, deployed to GitHub Pages at `/portfolio`.
Target: same content engine, AWS-hosted at `markmccomiskey.com`, GitHub-synced.

---

## Decisions

| Question | Decision |
|---|---|
| Domain | `markmccomiskey.com`, registered through Route 53. Available, $16.00/year. |
| Site generator | Next.js 16 static export. No rewrite. |
| Infrastructure as code | Terraform, in `infra/`. |
| GitHub sync | A scheduled GitHub Actions workflow. No Lambda. |
| Education and Interests | Folded into `/about` as sections. |
| Visual direction | Refine the current tokens. Same palette and fonts, reworked spacing, hierarchy, and hero. |
| Resume | Built from structured data. The page renders it, and the PDF is generated from the same source. |
| Write-ups URL | `/writing`. |
| Repo selection | An allowlist in `content/repo-sources.yml`. |
| Private repos | Not read. Public repos only. |
| LLM-written content | Deferred, not rejected. See Phase 4. |
| Contact | LinkedIn and GitHub links only. No email address, no form. |
| AI chat widget | Cut from scope 2026-09-23. |
| Placeholder content | Working fixtures that exercise every feature, behind a `placeholder` flag. Not empty stubs. See section 7. |

### AWS account state, as built

| Item | Value |
|---|---|
| Account | 692112934115, created 2026-09-23 |
| Admin access | IAM Identity Center user `mark`, permission set `AdminAccess`, 4-hour sessions |
| CLI profile | `portfolio`, region `us-east-1`. Refresh with `aws sso login --profile portfolio` |
| Terraform auth | `AWS_PROFILE=portfolio` |
| IAM users | none. No static access keys exist. |
| Root user | MFA enabled, virtual device `mark_cell`. No access keys. |
| Budget | `monthly-cost-10usd`: $10/month, email alerts at 85% actual, 100% actual, 100% forecast |

---

## 0. Where the current site stands

What exists and works:

| Area | Current state | Verdict |
|---|---|---|
| Framework | Next.js 16 `output: "export"` to `out/` | **Keep** |
| Content model | MDX + frontmatter, Zod-validated (`src/lib/content/schemas.ts`) | **Keep, extend** |
| Loaders | `getAllPosts`, `getAllProjects`, `getStaticPage`, skills, repos | **Keep, extend** |
| Code highlighting | Shiki v4, build-time | **Keep** |
| Pages | home, blog index + detail, skills, about, education, interests, resume | **Restructure** |
| GitHub sync | `ingest-repo.mjs` + 3 workflows, LLM-drafts MDX posts | **Rebuild** |
| Hosting | GitHub Pages via `peaceiris/actions-gh-pages` | **Replace** |
| Resume | `/resume` iframes `/resume.pdf` — **the file does not exist** | **Fix** |
| Analytics | none | **Add** |

Problems the new requirements expose:

1. **No project pages.** `content/projects/*.mdx` bodies are never rendered. `ProjectCard` links out to a blog post or to GitHub. The two-layer write-up format has nowhere to live.
2. **Bots and humans write the same files.** `ingest-repo.mjs` generates `content/posts/*.mdx` and `sync-skills.mjs` rewrites `content/skills.json`. Once you edit a generated post, the next sync either clobbers it or needs conflict-prone merge logic. This is the single biggest structural fix in this plan.
3. **Projects and posts are conflated.** A repo currently produces a *blog post*. The new model needs repo metadata to become a project record, with narrative as a separate authored layer.
4. **LLM in the sync path.** Ingestion calls OpenAI/Anthropic to draft prose. That is a cost, a quality, and a trust liability on a credibility-focused site. Sync should pull facts only. Prose stays yours.
5. **`basePath: "/portfolio"`** is baked into config and the deploy workflow. It must become `""` for a root domain.
6. **No featured/archive split at scale.** Home splits on a `featured` boolean, but there is no archive page, no filtering, and no cap on the featured set.
7. **No shipped-vs-exploration distinction, no metrics, no timeline, no "what I'm looking for".**

---

## 1. Recommended stack

### 1.1 Static site generator — keep Next.js static export

Honest comparison of the three options in your prompt:

- **Astro** is the best *greenfield* fit: zero JS by default, islands for anything interactive, and content collections with built-in Zod schema validation — almost exactly what `src/lib/content/` hand-rolls today.
- **Hugo** builds fastest and needs no npm tree, but templating is Go and MDX is not native. Wrong tool when TypeScript is already in play.
- **Plain HTML/CSS/JS** does not survive the requirement that the site grows from a generated data file. Rejected.

**Recommendation: stay on Next.js.** Not because Next beats Astro here, but because the expensive part — schemas, loaders, MDX pipeline, Shiki, design tokens, a working static export — already exists and already produces a plain `out/` directory that uploads to S3 unchanged. An Astro rewrite is a lateral move that would consume the whole Phase 1 budget to arrive at the same page count.

Tradeoff accepted: Next ships more client JS than Astro for equivalent pages, and Next 16 static export has sharper edges — no image optimization, no middleware, no route handlers. Nothing in this plan needs server-side request handling, so none of those bite. If you later want a feature that does (a contact form backend, or the chat widget you cut), it lives in a Lambda outside the site, not in the framework.

Escape hatch: `loaders.ts` reads files and returns plain objects, so the content layer is framework-agnostic. If static export becomes a fight, porting to Astro is a rendering-layer swap, not a rewrite. Revisit only if that happens.

### 1.2 Infrastructure as code — Terraform

- **Terraform**: `terraform plan` output is a reviewable diff in a PR, there is no bootstrap stack, and S3 + CloudFront + ACM + Route 53 is the most copy-pasteable pattern in the ecosystem. Cost: HCL becomes a second language in the repo.
- **AWS CDK**: reuses TypeScript, but adds a bootstrap stack, a synth step, and CloudFormation as the real execution engine — which is what you end up debugging. Over-tooled for roughly eight resources.

**Recommendation: Terraform**, in `infra/`, with state in an S3 bucket and locking enabled.

### 1.3 GitHub sync — GitHub Actions, not Lambda

A Lambda puller only wins if the site must update *without* a rebuild. It does not: the site is static, so any data change needs a rebuild and redeploy anyway. Actions costs nothing on a public repo, keeps the token where the repos live, and makes every sync a reviewable commit.

**Recommendation: a scheduled GitHub Actions workflow.** Revisit only if you later want live repo data fetched client-side.

---

## 2. Target site structure

```
/                      Hero (30s skim) + 3-5 featured projects + what I'm looking for teaser
/projects              Featured set, then searchable/filterable archive
/projects/[slug]       Project page: summary block, metrics, narrative, repo metadata
/writing               Write-ups index                  (rename of /blog)
/writing/[slug]        Post
/resume                Resume rendered from structured data + PDF download + what I'm looking for
/about                 About, education, interests, contact links
/timeline              Growth changelog
/colophon              "How I built this" — also featured as a project
/skills                Skills, cross-referenced to projects
```

Changes from today:

- **New**: `/projects`, `/projects/[slug]`, `/timeline`, `/colophon`.
- **Renamed**: `/blog` to `/writing`.
- **Merged**: `/education` and `/interests` become sections of `/about`. Their MDX bodies move into `about.mdx`. The two routes are removed.
- **Nav** shrinks to: Projects, Writing, Resume, About. Everything else stays reachable but out of the top bar.
- **Contact**: LinkedIn and GitHub links in the footer and on `/about`. No email address, and no form, so no backend.

Mobile-first: the hero is the only above-the-fold contract — name, one line on what you do, three featured cards, resume link. Build and review it at 375px before desktop.

---

## 3. Data model

The governing rule of this refactor:

> **Automation writes only to `content/generated/`. Humans write only to `content/`. Nothing writes to both.**

The two layers merge at build time, keyed by slug. Automation can never overwrite your words, and you never hand-edit a file the bot owns.

### 3.1 Authored — `content/projects/<slug>.mdx` (yours, authoritative)

```yaml
---
title: "Fantasy Edge"
slug: "fantasy-edge"
summary: "Two to three sentences for skimmers."   # layer 1 of the two-layer format
status: "shipped"                 # "shipped" | "exploration"  <- dilution guard
featured: 3                       # 1-5 = pinned rank, omit = archive only
placeholder: false                # true = fixture. Excluded from production builds. See section 7.
repo: "mccomark21/fantasy-edge"   # merge key into the generated repo record
role: "Solo"
period: { start: "2026-01", end: null }
metrics:                          # surfaced on cards and project pages
  - label: "Rows processed"
    value: "12M"
  - label: "Query p95"
    value: "180ms -> 40ms"
links:
  demo: "https://..."
  writeup: "fantasy-edge"         # slug in content/posts
tags: ["data-analysis"]           # data-analysis | application | model
---

Full narrative below the fold: problem, approach, what I learned.   <- layer 2
```

### 3.2 Generated — `content/generated/repos.json` (bot-owned, never hand-edited)

```json
{
  "generatedAt": "2026-09-22T09:00:00Z",
  "repos": {
    "mccomark21/fantasy-edge": {
      "description": "...",
      "languages": { "TypeScript": 84213, "Python": 9102 },
      "topics": ["duckdb", "nfl"],
      "stars": 4,
      "pushedAt": "2026-09-19T00:00:00Z",
      "createdAt": "2026-01-04T00:00:00Z",
      "defaultBranch": "main",
      "homepage": "https://...",
      "readmeExcerpt": "first paragraph, verbatim, truncated",
      "license": "MIT",
      "archived": false
    }
  }
}
```

`readmeExcerpt` is the **verbatim** first paragraph, not an LLM summary. Facts only.

### 3.3 Generated — `content/generated/timeline.json` (bot-owned)

An append-only event log that powers `/timeline`:

```json
{ "date": "2026-03-04", "type": "repo-created", "repo": "...", "text": "Started Fantasy Edge" }
{ "date": "2026-06-11", "type": "language-first-seen", "text": "First Rust in a public repo" }
{ "date": "2026-07-02", "type": "authored", "text": "Published: How I built this site" }
```

Event types: `repo-created`, `repo-archived`, `language-first-seen`, `topic-first-seen`, `release`, `authored` (from your MDX dates). Append-only, so history never rewrites: the sync job adds events it has not seen and deletes nothing.

### 3.4 Generated — `content/generated/skills.json`

Derived from repo languages and topics, unioned with the `techStack` fields you write. This replaces the hand-curated `content/skills.json`, which becomes `content/skill-overrides.json` for category naming, display names, and an exclusion list.

### 3.5 Field ownership

| Field | Source |
|---|---|
| languages, topics, stars, dates, license, README excerpt | **GitHub, automatic** |
| summary, narrative, metrics, role, "what I learned" | **You, manual** |
| `status` (shipped vs exploration), `featured` rank, tags | **You, manual** |
| skills list | **Derived**, with your override file |
| timeline events | **Derived** from repo dates and your post dates |

---

## 4. GitHub sync mechanism

**Trigger**: scheduled `cron: "0 9 * * 1"` (weekly, matching today's refresh job), plus `workflow_dispatch`, plus an optional `repository_dispatch` so any of your repos can ping this one on push.

**Auth**: a fine-grained PAT restricted to public repositories, with `metadata: read` and `contents: read`, stored as `secrets.SYNC_TOKEN`. The default `GITHUB_TOKEN` cannot read your other repos, so it is not enough. The token carries no private repository scope, by decision. A leaked generated file therefore exposes nothing that GitHub does not already serve publicly.

**What it pulls**, per repo in the include list: description, topics, languages, stars, forks, created and pushed dates, default branch, homepage, license, latest release, and the README's first paragraph verbatim.

**Repo selection**: an allowlist in `content/repo-sources.yml`. Each entry names one public repository. No repository reaches the site until you add it there. The file also sets `skipArchived: true` and `skipForks: true` as a second guard.

**Merge safety**: the job writes *only* to `content/generated/**`. It never touches `content/projects/`, `content/posts/`, or `content/pages/`, so conflicts with your writing are structurally impossible.

**Output**: a pull request (never a direct push to main) titled `sync: refresh repo metadata`, labelled `automation`, summarising what changed. You merge the PR. The merge triggers deploy. Any repo present in `repos.json` with no matching `content/projects/*.mdx` appears as a PR checklist item — "3 repos have no project page yet" — so growth is surfaced without auto-publishing thin content.

**Timeline feed**: the same job diffs the new `repos.json` against the previous one and appends new events to `timeline.json`.

**Removed**: `ingest-repo.mjs`, `llm-client.mjs`, `refresh-content.mjs`, `sync-skills.mjs`, and their three workflows collapse into one `sync-repos.mjs` and one workflow. The `needsReview` frontmatter flag and `.github/state/content-refresh.json` disappear — the PR *is* the review.

---

## 5. AWS infrastructure

One Terraform stack in `infra/`:

- **S3**: private bucket, public access blocked, website hosting off.
- **CloudFront**: Origin Access Control, `index.html` as default root, 404 mapped to `/404.html`, HTTP to HTTPS redirect, compression on, `PriceClass_100`.
- **CloudFront Function** on viewer request, rewriting `/path/` to `/path/index.html`. Needed because `trailingSlash: true` plus S3 behind OAC does not resolve directory indexes.
- **ACM** certificate in `us-east-1`, DNS-validated.
- **Route 53**: hosted zone plus A and AAAA alias records to the distribution.
- **Logging**: CloudFront standard logging (v2) into a logs bucket, lifecycle expiry at 90 days.
- **Budgets**: the account already has `monthly-cost-10usd`, a $10/month budget with email alerts at 85% actual, 100% actual, and 100% forecast. Import it into Terraform rather than creating a second budget.

**Deploy pipeline** replaces `peaceiris/actions-gh-pages`: build, then `aws s3 sync out/ --delete`, then a CloudFront invalidation of `/*`. Authentication uses GitHub OIDC assuming an IAM role — **no long-lived AWS keys in GitHub secrets**.

**Analytics**: start with CloudFront logs, an Athena table, and a few saved queries in `scripts/analytics/*.sql`. Athena bills per byte scanned. At this log volume that is cents, and partitioning by date keeps it there. If you want a dashboard rather than queries, self-hosted Umami is the next step, but it needs a database, which breaks the budget. Plausible Cloud at roughly $9/month would cost more than everything else on this plan combined.

**Budget estimate, annual**

| Item | Cost |
|---|---|
| Domain `markmccomiskey.com`, through Route 53 | $16.00 |
| Route 53 hosted zone | $6.00 |
| Route 53 queries | under $1 |
| S3 storage and requests | under $1 |
| CloudFront (PriceClass_100, low traffic) | $0-2 |
| ACM | $0 |
| CloudFront logs to S3 plus Athena | under $2 |
| **Total** | **roughly $25-27** |

That is inside the $40 target and inside your $10/month ceiling. The domain is the largest single line. Route 53 charges $73 to restore a `.com` after it lapses, so enable auto-renew at registration. Things that would break it: WAF (around $60/yr minimum), a NAT gateway (never provision one), Plausible Cloud at roughly $108/yr, or any always-on compute. Nothing in this plan requires any of them. Adding the cut chat widget back would add roughly $12-36/yr in model tokens and would need its own spend caps.

---

## 6. Phased build plan

### Phase 0 — Cleanup and prep (small)

Repo hygiene, no user-visible change. Unblocks everything else.

| # | Task | Acceptance |
|---|---|---|
| 0.1 | Resolve the eight deleted `.github/skills/*` files in the working tree: commit the deletion or restore them | `git status` is clean |
| 0.2 | Default `basePath` to `""`. Drop `NEXT_PUBLIC_BASE_PATH` from the build | the site builds for a root domain |
| 0.3 | Add `public/resume.pdf`, or make `/resume` degrade gracefully when it is absent | `/resume` no longer renders a broken iframe |
| 0.4 | Delete the four legacy sync scripts and three workflows | only `deploy.yml` remains |
| 0.5 | AWS account hardening | **done 2026-09-23.** Root MFA on, no root keys, no IAM users, no static keys, Identity Center admin, $10 budget with alerts |

### Phase 1 — Static skeleton live on AWS (large)

A real domain serving a real portfolio with manually authored featured projects. Everything after this is additive.

| # | Task | Acceptance |
|---|---|---|
| 1.1 | Extend `schemas.ts` with the section 3.1 project frontmatter. Update `validate-content.mjs` | invalid frontmatter fails CI |
| 1.2 | Build `/projects/[slug]`, rendering the MDX body in the two-layer layout | every project has a page |
| 1.3 | Rebuild home: hero, `featured` ranks 1-5, what-I'm-looking-for teaser, mobile-first at 375px | the 30-second skim works on a phone |
| 1.4 | `/projects` archive with search and filters for tag, language, and shipped vs exploration | featured work is never buried |
| 1.5 | Restructure nav and routes per section 2. Move `education.mdx` and `interests.mdx` into `about.mdx`. Rename `/blog` to `/writing` | nav has four items, and no route 404s |
| 1.6 | Resume from structured data: a schema, a render, and a PDF generated from the same source | one edit updates both the page and the PDF |
| 1.7 | Refine the visual layer: spacing scale, type hierarchy, and the hero, on the existing tokens | reviewed at 375px and at desktop width |
| 1.8 | `infra/bootstrap/`: Terraform state bucket, state locking, GitHub OIDC provider, and the two project roles | applied once under `AWS_PROFILE=portfolio` |
| 1.9 | `infra/` Terraform: S3, CloudFront, OAC, ACM, Route 53, CF function, logging. Import the existing budget | `terraform apply` from zero yields a working HTTPS site |
| 1.10 | New `deploy.yml`: assume the OIDC role, `s3 sync`, invalidate | a push to main goes live with no AWS key stored |
| 1.11 | Register `markmccomiskey.com` with auto-renew on, point Route 53 at it, verify the certificate | the site is live on the real domain |
| 1.12 | Write 3-5 real featured projects with summary, metrics, and narrative | home is credible with no automation yet |
| 1.13 | `placeholder` flag in the schema, the build-time filter, the UI badge, and the CI gate | a production build with the flag unset emits no placeholder page |
| 1.14 | Author the fixture set to the section 7.2 matrix | every feature in that table has a fixture that exercises it |

Task 1.13 comes before 1.3 and 1.4 in practice. The home page and the archive need content to render before you can judge either.

Two roles are created in task 1.8, and they stay separate.

| Role | Assumed by | Permissions |
|---|---|---|
| `portfolio-terraform` | you, under `AWS_PROFILE=portfolio` | broad. Creates S3, CloudFront, ACM, Route 53, IAM |
| `portfolio-deploy` | GitHub Actions, through OIDC | `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the site bucket, and `cloudfront:CreateInvalidation` on the one distribution |

The trust policy on `portfolio-deploy` must pin both the repository and the branch:

```
"token.actions.githubusercontent.com:sub": "repo:mccomark21/portfolio:ref:refs/heads/main"
"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
```

A wildcard in `sub` lets any GitHub repository assume the role. That is the most common way a personal AWS account is drained through Actions.

### Phase 2 — Sync, archive, timeline (medium)

| # | Task | Acceptance |
|---|---|---|
| 2.1 | `content/repo-sources.yml` plus its schema | an allowlist controls what syncs |
| 2.2 | `scripts/sync-repos.mjs` writing `content/generated/repos.json` | it writes only under `generated/` |
| 2.3 | Merge layer in `loaders.ts`: project MDX unioned with the repo record by slug | project pages show live languages and last-updated dates |
| 2.4 | Timeline diffing into append-only `timeline.json`, plus the `/timeline` page | running sync twice adds no duplicate events |
| 2.5 | Derived skills plus `skill-overrides.json`. Retire the hand-curated `skills.json` | `/skills` stays current with no manual edit |
| 2.6 | `sync-repos.yml`: weekly and dispatch, opens a PR, flags repos with no project page | the PR is reviewable and never conflicts with authored content |

### Phase 3 — Polish, SEO, analytics, colophon (medium)

| # | Task | Acceptance |
|---|---|---|
| 3.1 | `/colophon` — how I built this, cross-listed as a featured project | the site is its own case study |
| 3.2 | SEO: per-page metadata, OG images, `sitemap.xml`, `robots.txt`, JSON-LD `Person` | structured data validates |
| 3.3 | Athena table and saved queries over CloudFront logs | you can answer which project page gets read most |
| 3.4 | Performance and accessibility pass: Lighthouse 95+ on mobile, keyboard nav, contrast, reduced motion | measured, not asserted |
| 3.5 | 404 page, CI link checker, favicon and OG assets | no dead links |

### Phase 4 — Assisted drafting (medium, deferred)

Deferred by decision on 2026-09-23. You want LLM-written drafts, but only after written instructions raise the starting quality. The instructions are the deliverable here. The mechanism is the smaller half.

One constraint sets the shape of this phase. Your global `writing-style.md` excludes portfolio copy from its own rules, and it states the reason: "STE is flat and literal by design. It is the wrong tool where voice is the point." So this phase cannot reuse that file. It needs a separate voice guide.

| # | Task | Acceptance |
|---|---|---|
| 4.1 | Write `docs/voice.md`: how a write-up opens, how to state a result without marketing adjectives, the depth of a "what I learned" section, and the line between summary and narrative | 3 hand-written projects exist that the guide describes accurately |
| 4.2 | Collect 3 worked examples of your own writing as few-shot input | examples come from projects you already shipped |
| 4.3 | A drafting command that reads the voice guide, the repo record, and your notes, and produces a draft to a scratch path | it never writes to `content/` directly |
| 4.4 | A review gate: every draft lands in a PR, and nothing publishes without your edit | no generated sentence reaches the site unread |

Task 4.1 depends on Phase 1 task 1.12. You cannot write the voice guide before you have writing to describe.

**Effort**: Phase 0 small, Phase 1 large, Phase 2 medium, Phase 3 medium, Phase 4 medium.
Phases 2 and 3 are independent of each other once Phase 1 is live, so order them by what you want soonest. Phase 4 follows Phase 1.

---

## 7. Placeholder content

No question blocks issue creation. Three areas carry placeholder content until you supply the real thing.

Placeholders are working fixtures, not empty stubs. They exercise every feature so that filtering, ranking, and layout are tested before real content exists.

### 7.1 The placeholder mechanism

Add `placeholder: boolean` to the project schema, default `false`. It behaves like the existing `published` flag on posts.

1. `npm run dev` renders placeholders always.
2. A production build excludes them, unless `INCLUDE_PLACEHOLDERS=1` is set.
3. A CI check fails the deploy when a placeholder would reach production without that flag.
4. A badge marks each placeholder in the UI while it renders.

This keeps one environment variable in control of what ships. You never hand-delete fixture files at launch.

### 7.2 What the fixture set must cover

A fixture set that does not exercise a feature does not test it.

| Feature | Fixture requirement |
|---|---|
| Featured ranking and cap | 5 projects at `featured: 1` through `5`, plus one duplicate rank to prove the collision check works |
| Shipped versus exploration | 3 or more of each `status` |
| Archive volume | 12 to 15 projects total, so search and filtering are real tests |
| Metrics block | some projects with 2 to 3 metrics, some with none |
| Two-layer format | one 3-sentence summary over a 1200-word narrative, and one over a 200-word narrative |
| Merge layer | one project with a synced repo, and one naming a repo the sync has never seen |
| Tag filter | coverage across `data-analysis`, `application`, and `model` |
| Timeline | events across 8 or more months |
| Skills cross-reference | tech that overlaps between projects |

Write fixture text at realistic length and in realistic sentence shape. Do not use lorem ipsum. Do not use titles such as "Sample Project 1". Short filler text hides the layout faults that appear only at real length. The badge marks the content, so the words do not have to.

### 7.3 The three placeholder areas

**What I'm looking for.** Placeholder text states target roles, type of work, employment or contract, and location. Nothing here can be inferred from the repository, so you write the real version. It is a launch blocker for task 1.11.

**Featured projects.** The home page holds 5 slots. Two real candidates exist today, `copilot-bootstrap` and `fantasy-edge`. Each real write-up replaces one fixture through task 1.12.

**Resume data.** Task 1.6 renders the resume from structured data, and that data does not exist yet. Supply your history in any form, including an existing PDF. The task converts it into the schema.

### 7.4 Launch gate

The site must not go public with a placeholder visible. Task 1.11 does not close until:

1. `INCLUDE_PLACEHOLDERS` is unset in the deploy workflow.
2. The CI placeholder check passes.
3. The "what I'm looking for" section holds your words.
4. At least 3 featured slots hold real projects.

### 7.5 Settled questions

The Decisions table near the top holds the eleven questions that this plan previously listed as open. Reopen any of them by editing that table and the sections it points to.
