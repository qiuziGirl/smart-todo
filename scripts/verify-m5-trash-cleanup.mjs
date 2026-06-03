/**
 * M5: verify the trash cleanup cron endpoint without deleting data.
 * Usage: npx dotenv -e .env.local -- node scripts/verify-m5-trash-cleanup.mjs
 */
const base = (process.env.CRON_TEST_URL || "http://localhost:3005").replace(
  /\/$/,
  "",
);

if (!process.env.CRON_SECRET?.trim()) {
  console.error(
    "Missing CRON_SECRET. Run: npx dotenv -e .env.local -- node scripts/verify-m5-trash-cleanup.mjs",
  );
  process.exit(1);
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

const url = `${base}/api/cron/trash-cleanup?dryRun=1`;
let res;
try {
  res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
} catch (e) {
  if (isConnRefused(e)) {
    console.error(
      `Cannot connect to ${base} (ECONNREFUSED). Start the app first, or set CRON_TEST_URL to a reachable base URL.`,
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

if (
  res.status !== 200 ||
  body?.ok !== true ||
  body?.dryRun !== true ||
  typeof body?.eligible !== "number"
) {
  const preview =
    text.length > 800 ? `${text.slice(0, 800)}...(truncated)` : text;
  console.error("Trash cleanup check failed", {
    status: res.status,
    json: body,
    bodyPreview: preview || "(empty)",
  });
  process.exit(1);
}

console.log("M5 trash cleanup OK:", JSON.stringify(body));
