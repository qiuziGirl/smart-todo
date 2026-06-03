/**
 * M4：校验 Cron 所需环境变量，并请求 /api/cron/remind。
 * 用法：npx dotenv -e .env.local -- node scripts/verify-m4-cron.mjs
 * 可选：CRON_TEST_URL=https://你的域名 npm run verify:m4-cron（需已配置同名环境变量）
 */
const base = (process.env.CRON_TEST_URL || "http://localhost:3005").replace(
  /\/$/,
  "",
);

const required = [
  "CRON_SECRET",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

for (const k of required) {
  if (!process.env[k]?.trim()) {
    console.error(
      `Missing ${k}. Run: npx dotenv -e .env.local -- node scripts/verify-m4-cron.mjs`,
    );
    process.exit(1);
  }
}

if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) {
  console.warn(
    "WARN: NEXT_PUBLIC_APP_URL is empty; notification links may fall back to VERCEL_URL or localhost.",
  );
}

function isConnRefused(err) {
  if (err?.code === "ECONNREFUSED") return true;
  if (err?.cause?.code === "ECONNREFUSED") return true;
  const agg = err?.cause;
  if (agg?.name === "AggregateError" && Array.isArray(agg.errors)) {
    return agg.errors.some((x) => x?.code === "ECONNREFUSED");
  }
  return false;
}

const url = `${base}/api/cron/remind`;
let res;
try {
  res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
} catch (e) {
  if (isConnRefused(e)) {
    console.error(
      `Cannot connect to ${base} (ECONNREFUSED). Start the app first (e.g. pnpm run dev on port 3005), or set CRON_TEST_URL to a reachable base URL.`,
    );
  } else {
    console.error("Request failed:", e?.message ?? e);
  }
  process.exit(1);
}
const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = null;
}

if (res.status !== 200 || body?.ok !== true) {
  const preview =
    text.length > 800 ? `${text.slice(0, 800)}…(truncated)` : text;
  console.error("Cron check failed", {
    status: res.status,
    json: body,
    bodyPreview: preview || "(empty)",
  });
  if (res.status === 500 && !body) {
    console.error(
      "Hint: non-JSON 500 often means an unhandled server error (e.g. Prisma/DB). Check dev server terminal and DATABASE_URL.",
    );
  }
  process.exit(1);
}

console.log("M4 cron OK:", JSON.stringify(body));
