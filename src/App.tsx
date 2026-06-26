import { useEffect, useState } from "react";
import logo from "./assets/logo.svg";

interface Info {
  app: string;
  runtime: string;
  denoVersion: string;
  nodeEnv: string;
  port: number;
  time: string;
}

export function App() {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/info")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setInfo)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="page">
      <img className="logo" src={logo} alt="DollarDeploy logo" width={96} height={96} />
      <h1>Deno + Vite + React</h1>
      <p className="tagline">
        Deployed with{" "}
        <a href="https://dollardeploy.com" target="_blank" rel="noreferrer">
          DollarDeploy
        </a>
      </p>

      <section className="card">
        <h2>Live server info</h2>
        {error && <p className="error">Could not reach /api/info: {error}</p>}
        {!error && !info && <p>Loading…</p>}
        {info && (
          <dl>
            <dt>Runtime</dt>
            <dd>{info.runtime} {info.denoVersion}</dd>
            <dt>Environment</dt>
            <dd>{info.nodeEnv}</dd>
            <dt>Port</dt>
            <dd>{info.port}</dd>
            <dt>Server time</dt>
            <dd>{info.time}</dd>
          </dl>
        )}
      </section>

      <footer>
        This page is served by a single <code>Deno.serve</code> process from
        the Vite build in <code>dist/</code>.
      </footer>
    </main>
  );
}
