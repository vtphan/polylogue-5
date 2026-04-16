# Lens v1 App

This directory now hosts the greenfield Lens v1 application.

The product and runtime assumptions live in:

- `docs/technical-specs-v1.md`
- `docs/wireframes-v1.md`
- `docs/implementation-readiness-v1.md`

The legacy `lens-app/` directory is not the implementation base for this app.

## Planned slices

1. App scaffold and baseline tooling
2. Runtime schemas
3. Content loader and turn-ID normalization
4. Manifest and session-config discovery
5. Local session state and persistence

## Commands

After dependencies are installed:

- `npm run dev`
- `npm run build`
- `npm run lint`
