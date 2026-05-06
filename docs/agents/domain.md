# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- CONTEXT.md at the repo root, or
- CONTEXT-MAP.md at the repo root if it exists. It points at one CONTEXT.md per context. Read each one relevant to the topic.
- docs/adr/ and any relevant context-specific docs/adr/ directories.

If any of these files do not exist, proceed silently. Do not flag their absence and do not suggest creating them upfront. The producer skill (/grill-with-docs) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (most repos):

/
|- CONTEXT.md
|- docs/adr/
|  |- 0001-example-decision.md
|  |- 0002-example-decision.md
|- src/

Multi-context repo (presence of CONTEXT-MAP.md at the root):

/
|- CONTEXT-MAP.md
|- docs/adr/                          <- system-wide decisions
|- src/
   |- ordering/
   |  |- CONTEXT.md
   |  |- docs/adr/                    <- context-specific decisions
   |- billing/
      |- CONTEXT.md
      |- docs/adr/

## Use the glossary vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in CONTEXT.md. Do not drift to synonyms the glossary explicitly avoids.

If the concept you need is not in the glossary yet, that is a signal. Either you are inventing language the project does not use (reconsider) or there is a real gap (note it for /grill-with-docs).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
