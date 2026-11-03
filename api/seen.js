// Sends a Discord message when the page is opened or watched to the end.
// Needs one Vercel environment variable: DISCORD_WEBHOOK_URL
const EVENTS = {
  open:   "💌 **Meryem's page was opened**",
  end:    "❤️ **Watched to the end** (the heart formed)",
  replay: "🔁 **Watched it again**",
};
const ALLOWED_HOST = "for-my-love-meryem.vercel.app";

// small in-memory throttle so nobody can flood the Discord channel
let recent = [];

function device(ua) {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android"
    : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Unknown device";
  const app = /Instagram/.test(ua) ? "Instagram" : /FBAN|FBAV/.test(ua) ? "Facebook" : /Snapchat/.test(ua) ? "Snapchat"
    : /TikTok|musical_ly/.test(ua) ? "TikTok" : /WhatsApp/.test(ua) ? "WhatsApp"
    : /EdgiOS|EdgA|Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari" : "browser";
  return `${os} · ${app}`;
}
const flag = cc => /^[A-Z]{2}$/.test(cc || "") ? String.fromCodePoint(...[...cc].map(c => 0x1f1a5 + c.charCodeAt(0))) : "";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const origin = req.headers.origin || req.headers.referer || "";
  if (origin && !origin.includes(ALLOWED_HOST)) return res.status(403).end();

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const title = EVENTS[body && body.e];
  if (!title) return res.status(400).end();

  const now = Date.now();
  recent = recent.filter(t => now - t < 60_000);
  if (recent.length >= 12) return res.status(429).end();
  recent.push(now);

  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return res.status(204).end();

  const ts = Math.floor(now / 1000);
  const city = decodeURIComponent(req.headers["x-vercel-ip-city"] || "");
  const cc = req.headers["x-vercel-ip-country"] || "";
  const where = [flag(cc), city, cc].filter(Boolean).join(" ");
  const content = `${title}\n🕒 <t:${ts}:F> (<t:${ts}:R>)\n📱 ${device(req.headers["user-agent"] || "")}${where ? `\n📍 ${where}` : ""}`;

  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, username: "for Meryem", allowed_mentions: { parse: [] } }),
    });
  } catch (e) {}
  res.status(204).end();
};
