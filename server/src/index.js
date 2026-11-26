import { handleApi } from "./api.js";
import { authUser } from "./auth.js";
import { json, err, corsHeaders, originAllowed } from "./util.js";
import { START_RATING } from "./elo.js";
import adminHtml from "../admin.html";
import { taoSaoLuu } from "./backup.js";

export { Matchmaker } from "./matchmaker.js";
export { Match } from "./match.js";

function withCors(res, request, env) {
  if (res.status === 101) return res;
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, env))) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

function wsToken(request) {
  const p = (request.headers.get("sec-websocket-protocol") || "").split(",").map((s) => s.trim());
  const t = p.find((s) => s.startsWith("tk."));
  return t ? t.slice(3) : "";
}

async function handlePlay(request, env, url) {
  if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") return err(426, "upgrade_required");
  const origin = request.headers.get("origin");
  if (origin && !originAllowed(origin, env)) return err(403, "bad_origin");
  const user = await authUser(env, wsToken(request));
  if (!user) return err(401, "unauthorized", "Cần đăng nhập");
  const room = url.searchParams.get("room");
  let stub;
  if (room) {
    if (!/^m-[a-z0-9]{1,12}$/.test(room)) return err(400, "bad_room");
    stub = env.MATCH.get(env.MATCH.idFromName(room));
  } else {
    stub = env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global"));
  }
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith("x-ltd-")) h.delete(k);
  h.set("x-ltd-uid", String(user.id));
  h.set("x-ltd-name", encodeURIComponent(user.display));
  if (!room) {
    const r = await env.DB.prepare("SELECT rating FROM ratings WHERE user_id=? AND mode='online'").bind(user.id).first();
    h.set("x-ltd-rating", String(r ? r.rating : START_RATING));
  }
  return stub.fetch(new Request(request.url, { method: "GET", headers: h }));
}

export default {
  // Cron (wrangler.toml [triggers]): sao lưu D1 vào KV mỗi tuần.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(taoSaoLuu(env, Date.now(), "cron").then((r) => console.log("sao lưu", r.key, r.gz, "byte"), (e) => console.error("sao lưu lỗi", e && e.stack || e)));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      if (url.pathname === "/api/play") return await handlePlay(request, env, url);
      if (url.pathname === "/admin" || url.pathname === "/admin/") {
        return new Response(adminHtml, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-frame-options": "DENY" } });
      }
      if (url.pathname.startsWith("/api/")) return withCors(await handleApi(request, env, url), request, env);
      if (url.pathname === "/") return new Response("Linh Thú Tam Địa - máy chủ online\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
      return new Response("Not found", { status: 404 });
    } catch (e) {
      const status = (e && e.status) || 500;
      if (status === 500) console.error("lỗi", e && e.stack || e);
      return withCors(json({ ok: false, error: status === 500 ? "server_error" : e.message }, status), request, env);
    }
  },
};
