# Example Deno app for DollarDeploy

A small, working example of a **Deno + Vite + React** app that deploys cleanly
on [DollarDeploy](https://dollardeploy.com) using its Deno buildpack.

A single `Deno.serve` process serves the Vite-built React frontend from `dist/`
and exposes a tiny JSON API. The page shows live info reported by the server and
a "Deployed with DollarDeploy" badge.

```
deno.json        deno tasks (dev / build / start / test) + imports
deno.lock        lockfile -> DollarDeploy runs `deno ci`
vite.config.ts   builds the React app in src/ into dist/
index.html       Vite entry
src/             React frontend (App.tsx, main.tsx, app.css, assets/logo.svg)
server.ts        Deno.serve: static dist/ + /api/info + /health
server_test.ts   deno test for the API handlers
```

## Routes

| Route       | Response                                                        |
| ----------- | -------------------------------------------------------------- |
| `GET /`     | The React app (served from `dist/`)                            |
| `GET /api/info` | JSON: runtime, Deno version, env, port, server time       |
| `GET /health`   | `{"ok":true}` — used for health checks                    |

## Local development

Requires [Deno](https://deno.land) 2.x.

```sh
deno task dev      # Vite dev server with HMR (frontend only)
deno task build    # vite build -> dist/
deno task start    # serve dist/ + API with Deno.serve (default port 3000)
deno task test     # run the server tests
```

To run the production server locally exactly as DollarDeploy does:

```sh
deno task build
PORT=3000 HOSTNAME=127.0.0.1 NODE_ENV=production deno task start
# -> http://127.0.0.1:3000
```

## How DollarDeploy builds and runs it

This app matches DollarDeploy's Deno buildpack with no extra configuration:

- **Detected as a Deno app** because `deno.json` is present.
- **Install:** `deno.lock` is present, so the build runs `deno ci`.
- **Build:** runs `deno task build` (`vite build`) to produce `dist/`.
- **Start:** systemd runs `deno task start`, i.e.
  `deno run --allow-net --allow-env --allow-read server.ts`.
- **Port:** defaults to `3000`; DollarDeploy injects `PORT` (and `HOSTNAME`,
  `NODE_ENV`, `DENO_DIR`) as environment variables. The server reads them from
  `Deno.env` — it does **not** depend on a `--env-file`, which would not exist
  at runtime.

The start task only requests the permissions it needs: `--allow-net` to listen,
`--allow-env` to read `PORT`/`HOSTNAME`/`NODE_ENV`, and `--allow-read` to serve
files from `dist/`.
