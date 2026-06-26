# Example Deno + Vite + React app for DollarDeploy

## Goal

A small, real, working example app that demonstrates DollarDeploy's new Deno
buildpack (introduced in dollardeploy/app#700). It must build and run cleanly
both locally and under the DollarDeploy build/deploy scripts, and it should
visibly show DollarDeploy branding ("Deployed with DollarDeploy" + logo).

## Why this shape

PR #700's own test fixtures model a **Deno + Vite** app
(`tasks: { build: "vite build", start: "deno run ..." }`). Mirroring that
exercises both halves of the buildpack:

- `deno task build` → produces a static frontend bundle
- `deno task start` → a `Deno.serve` server that serves the bundle + a JSON API

A React frontend (kept deliberately small) makes the example representative of
what users actually deploy, while the server stays a single focused file.

## How it maps to the DollarDeploy Deno buildpack (PR #700)

- **Detection:** presence of `deno.json` → app detected as `type: "deno"`.
- **Install:** `deno.lock` present → build script runs `deno ci`.
- **Build:** `deno task build` → `vite build` emits `dist/`.
- **Start:** systemd runs `deno task start`. The start task must NOT depend on a
  `--env-file` (none exists at runtime; env arrives via the systemd
  EnvironmentFile). Server reads `Deno.env` directly.
- **Runtime env injected by DollarDeploy:** `PORT` (default 3000), `HOSTNAME`
  (default 127.0.0.1), `NODE_ENV=production`, `DENO_DIR`. Server binds to
  `PORT` and `HOSTNAME`.
- **Permissions:** start task uses `--allow-net --allow-env --allow-read`.

## File layout

```
deno.json          # tasks: dev, build, start, test; imports (react, vite plugin)
deno.lock          # lockfile so DollarDeploy runs `deno ci`
vite.config.ts     # React plugin; builds to dist/
index.html         # Vite HTML entry
src/main.tsx       # React entry, mounts <App/>
src/App.tsx        # UI: logo, "Deployed with DollarDeploy", live /api/info
src/app.css        # minimal styling
server.ts          # Deno.serve: static dist/ + /api/info + /health
server_test.ts     # deno test against handlers (no network bind)
.env.example       # documents PORT/HOSTNAME (informational)
.gitignore         # dist/, .deno-cache/, node_modules/
README.md          # local dev + how DollarDeploy builds/deploys it
```

## Server (`server.ts`)

`Deno.serve({ port, hostname }, handler)` where:
- `port = Number(Deno.env.get("PORT") ?? 3000)`
- `hostname = Deno.env.get("HOSTNAME") ?? "127.0.0.1"`

Handler routing:
- `GET /health` → `200 {"ok":true}` (DollarDeploy health checks).
- `GET /api/info` → `200 { app, runtime:"deno", denoVersion, nodeEnv, port, time }`.
- everything else → serve a file from `dist/`; unknown paths fall back to
  `dist/index.html` (SPA fallback). 404 only if `dist/` missing.

Static serving uses `jsr:@std/http/file-server`'s `serveDir` against `dist/`.

The routing logic is split into an exported `handler(req)` function so tests can
call it directly without binding a socket. `Deno.serve` is only invoked when the
module is run as the entrypoint (`if (import.meta.main)`).

## Frontend (`src/App.tsx`)

- DollarDeploy logo (bundled locally as `src/assets/logo.svg`, copied from
  https://dollardeploy.com/logo.svg, so the build has no network dependency).
- Heading + "Deployed with DollarDeploy" line linking to dollardeploy.com.
- On mount, `fetch("/api/info")` and render the returned JSON (runtime, Deno
  version, port, env, server time) in a small card — proving the
  client→server→deploy loop end to end.

React is pulled via Deno's npm specifiers in `deno.json` imports
(`npm:react`, `npm:react-dom`), built by `@vitejs/plugin-react`.

## Tasks (`deno.json`)

```jsonc
{
  "tasks": {
    "dev": "vite",
    "build": "vite build",
    "start": "deno run --allow-net --allow-env --allow-read server.ts",
    "test": "deno test --allow-env --allow-read"
  }
}
```

## Testing

`server_test.ts` uses `deno test` to call `handler()` with synthetic `Request`
objects:
- `/health` returns `{ok:true}`.
- `/api/info` returns JSON with `runtime === "deno"` and a numeric `port`.

These run without `vite build` (they don't touch `dist/`), so `deno task test`
is fast and hermetic.

## Verification (done before claiming completion)

1. `deno task build` succeeds and emits `dist/index.html` + assets.
2. `deno task test` passes.
3. `deno task start` boots; `curl /health` → `{"ok":true}`, `curl /api/info` →
   JSON, `curl /` → HTML containing the app.
4. Simulate DollarDeploy env: `PORT=8080 HOSTNAME=127.0.0.1 NODE_ENV=production`
   and confirm the server binds to 8080.

## Out of scope (YAGNI)

- No database / Postgres (can be a follow-up example).
- No auth, no router library, no CSS framework.
