/*
 * Proxy Cloudflare Worker pour l'atelier de vente.
 * Il garde la clé API Anthropic côté serveur : la page web ne la voit jamais.
 *
 * Déploiement rapide :
 *   1. cloudflare.com -> Workers & Pages -> Create -> Worker -> colle ce fichier -> Deploy
 *   2. Settings -> Variables and Secrets :
 *        - Secret  ANTHROPIC_API_KEY = ta clé (commence par sk-ant-...)
 *        - Variable MODEL (optionnel) = claude-haiku-5-5  (ou un autre modèle auquel tu as accès)
 *        - Variable ALLOWED_ORIGIN (optionnel) = l'URL de ta page GitHub Pages
 *   3. Copie l'URL du Worker (https://<nom>.<sous-domaine>.workers.dev)
 *      et colle-la dans API_ENDPOINT en haut de index.html
 *
 * Avec Wrangler en ligne de commande :
 *   npx wrangler deploy worker.js
 *   npx wrangler secret put ANTHROPIC_API_KEY
 */

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Méthode non autorisée" }, 405, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Clé API non configurée sur le serveur" }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Requête invalide" }, 400, cors);
    }
    const prompt = (body && typeof body.prompt === "string" ? body.prompt : "").slice(0, 8000);
    if (!prompt.trim()) {
      return json({ error: "Message vide" }, 400, cors);
    }

    let apiResp;
    try {
      apiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.MODEL || "claude-haiku-5-5",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (e) {
      return json({ error: "Service indisponible" }, 502, cors);
    }

    if (!apiResp.ok) {
      const detail = await apiResp.text().catch(() => "");
      return json({ error: "Erreur API", status: apiResp.status, detail: detail.slice(0, 500) }, 502, cors);
    }

    const data = await apiResp.json();
    const text = (data.content || []).map((b) => (b && b.text) || "").join("").trim();
    return json({ text }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
