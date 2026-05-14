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

const url = `${base}/api/cron/remind`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
});
const body = await res.json().catch(() => ({}));

if (res.status !== 200 || body.ok !== true) {
  console.error("Cron check failed", { status: res.status, body });
  process.exit(1);
}

console.log("M4 cron OK:", JSON.stringify(body));
