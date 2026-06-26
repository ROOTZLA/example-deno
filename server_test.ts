import { assertEquals } from "jsr:@std/assert@^1.0.8";
import { handler } from "./server.ts";

Deno.test("GET /health returns ok", async () => {
  const res = await handler(new Request("http://localhost/health"));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true });
});

Deno.test("GET /api/info reports the Deno runtime", async () => {
  const res = await handler(new Request("http://localhost/api/info"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.runtime, "deno");
  assertEquals(body.app, "example-deno");
  assertEquals(typeof body.port, "number");
  assertEquals(typeof body.denoVersion, "string");
});

Deno.test("PORT env var is reflected in /api/info", async () => {
  Deno.env.set("PORT", "8080");
  try {
    const res = await handler(new Request("http://localhost/api/info"));
    const body = await res.json();
    assertEquals(body.port, 8080);
  } finally {
    Deno.env.delete("PORT");
  }
});
