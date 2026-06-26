import { serveDir } from "@std/http/file-server";

const APP_NAME = "example-deno";
const DIST_DIR = new URL("./dist", import.meta.url).pathname;

/**
 * Single request handler for the whole app. Exported so tests can call it
 * directly without binding a socket.
 *
 * Routes:
 *   GET /health    -> health check for DollarDeploy
 *   GET /api/info  -> JSON describing the running server
 *   GET /*         -> static files from dist/, with SPA fallback to index.html
 */
export async function handler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (pathname === "/health") {
    return Response.json({ ok: true });
  }

  if (pathname === "/api/info") {
    return Response.json({
      app: APP_NAME,
      runtime: "deno",
      denoVersion: Deno.version.deno,
      nodeEnv: Deno.env.get("NODE_ENV") ?? "development",
      port: Number(Deno.env.get("PORT") ?? 3000),
      time: new Date().toISOString(),
    });
  }

  // Serve the Vite build output. quiet avoids per-request logging noise.
  const res = await serveDir(req, { fsRoot: DIST_DIR, quiet: true });

  // SPA fallback: for non-asset paths that 404, return index.html so client
  // routing keeps working. Asset-like paths (with an extension) keep their 404.
  if (res.status === 404 && !hasFileExtension(pathname)) {
    return await serveDir(new Request(new URL("/index.html", req.url), req), {
      fsRoot: DIST_DIR,
      quiet: true,
    });
  }

  return res;
}

function hasFileExtension(pathname: string): boolean {
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".");
}

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") ?? 3000);
  const hostname = Deno.env.get("HOSTNAME") ?? "127.0.0.1";
  Deno.serve({ port, hostname }, handler);
}
