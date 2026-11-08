import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";

const ENV_PATH = join(process.cwd(), ".env");

// Only variables needed by this repository may be written from the local setup page.
const SETUP_KEYS = [
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_OAUTH_ISSUER",
  "CLERK_OAUTH_CLIENT_ID",
  "CLERK_OAUTH_CLIENT_SECRET",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "TRIGGER_TELEGRAM_WEBHOOK_URL",
  "TRIGGER_TELEGRAM_WEBHOOK_SECRET",
  "TRIGGER_LINQ_WEBHOOK_URL",
  "TRIGGER_LINQ_WEBHOOK_SECRET",
  "FIRECRAWL_API_KEY",
  "DAYTONA_API_KEY",
  "SENTRY_DSN",
  "TRIGGER_SENTRY_DSN",
  "SENTRY_AUTH_TOKEN",
] as const;

type SetupKey = (typeof SETUP_KEYS)[number];

const SETUP_LINKS: Record<SetupKey, { label: string; url: string }> = {
  CLERK_SECRET_KEY: { label: "Clerk API keys", url: "https://dashboard.clerk.com/~/api-keys" },
  CLERK_PUBLISHABLE_KEY: { label: "Clerk API keys", url: "https://dashboard.clerk.com/~/api-keys" },
  CLERK_OAUTH_ISSUER: { label: "Clerk OAuth applications", url: "https://dashboard.clerk.com/~/oauth-applications" },
  CLERK_OAUTH_CLIENT_ID: { label: "Clerk OAuth applications", url: "https://dashboard.clerk.com/~/oauth-applications" },
  CLERK_OAUTH_CLIENT_SECRET: { label: "Clerk OAuth applications", url: "https://dashboard.clerk.com/~/oauth-applications" },
  TELEGRAM_BOT_TOKEN: { label: "Telegram BotFather", url: "https://t.me/BotFather" },
  TELEGRAM_WEBHOOK_SECRET: { label: "Telegram BotFather", url: "https://t.me/BotFather" },
  TRIGGER_TELEGRAM_WEBHOOK_URL: { label: "Trigger.dev dashboard", url: "https://trigger.dev/dashboard" },
  TRIGGER_TELEGRAM_WEBHOOK_SECRET: { label: "Trigger.dev dashboard", url: "https://trigger.dev/dashboard" },
  TRIGGER_LINQ_WEBHOOK_URL: { label: "Trigger.dev dashboard", url: "https://trigger.dev/dashboard" },
  TRIGGER_LINQ_WEBHOOK_SECRET: { label: "Trigger.dev dashboard", url: "https://trigger.dev/dashboard" },
  FIRECRAWL_API_KEY: { label: "Firecrawl API keys", url: "https://www.firecrawl.dev/app/api-keys" },
  DAYTONA_API_KEY: { label: "Daytona dashboard", url: "https://app.daytona.io/" },
  SENTRY_DSN: { label: "Sentry settings", url: "https://sentry.io/settings/" },
  TRIGGER_SENTRY_DSN: { label: "Sentry settings", url: "https://sentry.io/settings/" },
  SENTRY_AUTH_TOKEN: { label: "Sentry settings", url: "https://sentry.io/settings/" },
};

const parseEnv = (contents: string) => {
  const values = new Map<string, string>();
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    values.set(key, rawValue.replace(/^(['"])(.*)\1$/, "$2"));
  }
  return values;
};

const readEnvFile = async () => {
  try {
    return await readFile(ENV_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return "";
  }
};

const missingKeys = (contents: string) => {
  const fileValues = parseEnv(contents);
  return SETUP_KEYS.filter((key) => !process.env[key] && !fileValues.get(key)) as SetupKey[];
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const page = (keys: SetupKey[], message = "") => {
  const fields = keys
    .map(
      (key) => {
        const link = SETUP_LINKS[key];
        return `
        <label>
          <span>${key}<a href="${link.url}" target="_blank" rel="noreferrer">Open ${link.label} ↗</a></span>
          <input name="${key}" type="password" autocomplete="new-password" placeholder="Paste value" />
        </label>`;
      },
    )
    .join("");
  const noFields = keys.length === 0;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Personal Assistant Setup</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; background: #0b1020; color: #e8edf7; }
    main { width: min(720px, calc(100% - 32px)); margin: 48px auto; }
    .card { background: #121a2d; border: 1px solid #263455; border-radius: 20px; padding: 28px; box-shadow: 0 18px 60px #0005; }
    h1 { margin: 0 0 8px; font-size: 30px; letter-spacing: -.03em; }
    p { color: #aab7d1; line-height: 1.55; }
    .note { background: #18233d; border-radius: 12px; padding: 13px 15px; font-size: 14px; }
    label { display: block; margin: 18px 0; }
    label span { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #b9c7e1; font-size: 13px; margin-bottom: 7px; font-family: ui-monospace, monospace; }
    label a { color: #8db8ff; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; white-space: nowrap; }
    input { box-sizing: border-box; width: 100%; border: 1px solid #344566; border-radius: 10px; padding: 12px 13px; background: #0c1426; color: #fff; font-size: 15px; }
    input:focus { outline: 2px solid #6ea8fe; border-color: transparent; }
    button { border: 0; border-radius: 10px; padding: 12px 18px; background: #6ea8fe; color: #071021; font-weight: 750; cursor: pointer; }
    button:hover { background: #91bcff; }
    .success { color: #8ee6ae; }
    code { color: #c8d7ff; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <h1>Personal Assistant setup</h1>
      <p>Yahan sirf missing configuration fields dikh rahe hain. Jo values pehle se configured hain woh hide hain aur overwrite nahi hongi.</p>
      ${message ? `<p class="success">${escapeHtml(message)}</p>` : ""}
      ${noFields ? `<div class="note">All supported environment variables are configured. Existing values are hidden.</div>` : `
        <div class="note">Secrets browser mein display nahi honge. Save karne par values local <code>.env</code> file mein add hongi.</div>
        <form method="post" action="/setup">
          ${fields}
          <button type="submit">Save missing settings</button>
        </form>`}
    </section>
  </main>
</body>
</html>`;
};

export const setupPage = new Hono()
  .get("/", async (c) => {
    const contents = await readEnvFile();
    return c.html(page(missingKeys(contents)));
  })
  .post("/", async (c) => {
    const contents = await readEnvFile();
    const missing = missingKeys(contents);
    const body = await c.req.parseBody();
    const additions: string[] = [];

    for (const key of missing) {
      const value = typeof body[key] === "string" ? body[key].trim() : "";
      if (!value) continue;
      // Never accept line breaks or comments through the form; this keeps .env syntax intact.
      if (/[\r\n]/.test(value)) continue;
      additions.push(`${key}=${value}`);
      process.env[key] = value;
    }

    if (additions.length > 0) {
      const next = `${contents.replace(/\s*$/, "")}${contents.trim() ? "\n\n" : ""}# Added from local setup page\n${additions.join("\n")}\n`;
      await writeFile(ENV_PATH, next, { mode: 0o600 });
    }

    const after = missingKeys(await readEnvFile());
    const saved = additions.length;
    return c.html(page(after, saved ? `${saved} missing setting${saved === 1 ? "" : "s"} saved to .env.` : "Nothing new was saved."));
  });
