// Checks the database address in your .env and explains any problem in plain English.
// Run it from the project folder:   node scripts/check-db.mjs
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

const color = (code) => (text) => `\x1b[${code}m${text}\x1b[0m`;
const [green, red, yellow] = [color(32), color(31), color(33)];
const ok = (msg) => console.log(`${green("✓")} ${msg}`);
const warn = (msg) => console.log(`${yellow("!")} ${msg}`);
const fail = (problem, fix) => {
  console.log(`${red("✗")} ${problem}`);
  if (fix) console.log(`  → ${fix}`);
  console.log("");
  process.exit(1);
};

console.log("\nChecking your database connection...\n");

const raw = (process.env.DATABASE_URL || "").trim();
if (!raw) fail("DATABASE_URL is missing.", "Add a line DATABASE_URL=postgresql://... to the .env file in this folder.");
if (/YOUR-PASSWORD|\[|\]/i.test(raw)) fail("The address still contains [YOUR-PASSWORD] or square brackets.", "Replace [YOUR-PASSWORD] with your real database password and delete the [ ] brackets.");

let url;
try { url = new URL(raw); } catch {
  fail("DATABASE_URL isn't a valid address.", "It should start with postgresql://. If your password has symbols like # / ? @ %, reset it to letters and numbers only (Supabase → Project Settings → Database).");
}
if (!/^postgres(ql)?:$/.test(url.protocol)) fail("DATABASE_URL should start with postgresql://");

const host = url.hostname;
const port = url.port || "5432";
const user = decodeURIComponent(url.username);
const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

console.log(`  Host: ${host}`);
console.log(`  Port: ${port}`);
console.log(`  User: ${user}\n`);

if (isLocal) warn("This address points to a database on this computer, not Supabase.");
if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) {
  fail("This is Supabase's Direct connection. It needs IPv6, which most home networks and Vercel don't have.",
    "In Supabase click Connect → Direct → Session pooler, and copy that address (the host ends in pooler.supabase.com).");
}
if (host.endsWith(".pooler.supabase.com")) {
  if (!user.startsWith("postgres.")) fail(`Pooler usernames look like postgres.<project-id>, but yours is "${user}".`, "Copy the Session pooler address again from Supabase → Connect.");
  if (port === "6543") warn("Port 6543 is the Transaction pooler. Switch to port 5432 (Session pooler) for this app.");
}

// Same SSL handling as the app: strip SSL settings from the URL and allow Supabase's certificate.
for (const key of ["sslmode", "ssl", "uselibpqcompat"]) url.searchParams.delete(key);
const client = new pg.Client({
  connectionString: url.toString(),
  connectionTimeoutMillis: 15000,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});
client.on("error", () => {});

function explain(err) {
  const msg = String(err?.message || "");
  const code = String(err?.code || "");
  const rules = [
    [code === "28P01" || /password authentication failed/i.test(msg), "Wrong database password.",
      "Use the password you set when creating the Supabase project, or reset it (Project Settings → Database → Reset database password) and update .env."],
    [/circuit|too many authentication errors/i.test(msg), "Supabase has temporarily blocked logins after several wrong passwords.",
      "Wait 15–30 minutes, double-check the password in .env, then try again."],
    [/tenant/i.test(msg), "Supabase doesn't recognise this project at this address.",
      "Copy the full Session pooler address again from Supabase → Connect (the username must be postgres.<project-id> and the host must match your project's region), and make sure the project isn't paused."],
    [code === "ENOTFOUND" || code === "EAI_AGAIN", "The server address couldn't be found.",
      "Check the host for typos and make sure you're connected to the internet."],
    [code === "ECONNREFUSED", isLocal ? "No database is running on this computer." : "The server refused the connection.",
      isLocal ? "Put your Supabase Session pooler address in .env instead." : "Check that the port is 5432."],
    [["ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH"].includes(code) || /timeout/i.test(msg), "Couldn't reach the server (timed out).",
      "Use the Session pooler address (pooler.supabase.com, port 5432). If you use a VPN, try turning it off."],
    [/self[- ]signed|certificate/i.test(msg), "SSL certificate problem.",
      "Make sure you have the latest project files; they handle Supabase SSL automatically."],
    [code === "3D000", "That database name doesn't exist.", "The part after the last / in the address should be postgres."],
    [/max client|too many clients|remaining connection slots/i.test(msg), "Too many open connections.", "Wait a minute and try again."],
  ];
  const match = rules.find(([hit]) => hit);
  console.log(`${red("✗")} ${match ? match[1] : "Couldn't connect."}`);
  if (match) console.log(`  → ${match[2]}`);
  console.log(`\n  Technical details: ${[code, msg].filter(Boolean).join(" – ")}\n`);
}

try {
  await client.connect();
  const { rows } = await client.query("select current_user as who, split_part(version(), ' ', 2) as version");
  ok(`Connected! (PostgreSQL ${rows[0].version}, user ${rows[0].who})`);
  const tables = await client.query(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = any($1)",
    [["meal_entries", "workout_sessions", "daily_metrics", "weekly_checkins"]],
  );
  const n = tables.rows[0].n;
  if (n === 4) ok("All 4 app tables exist. Your database is ready.");
  else warn(`${n} of 4 app tables exist. Next, run:  npx drizzle-kit push`);
  console.log("");
} catch (err) {
  explain(err);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
