<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent Skills

This repo vendors [mattpocock/skills](https://github.com/mattpocock/skills) as a submodule at `vendor/mattpocock-skills`.

Primary workflow goals:
- Slash-command driven engineering workflows (`/tdd`, `/diagnose`, `/triage`, `/zoom-out`)
- Better codebase organization scaffolding (issue flow, context docs, ADR support)

First-time setup in your coding agent:
1. Run `/setup-matt-pocock-skills`
2. Choose `GitHub Issues` when prompted for issue tracking
3. Keep generated organizational docs lightweight at first, then expand as needed

Maintenance:
- Clone with submodules: `git clone --recurse-submodules <repo-url>`
- If already cloned: `git submodule update --init --recursive`
- Pull latest upstream skills: `git submodule update --remote vendor/mattpocock-skills`
