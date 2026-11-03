# Atelier vente, page d'exercices

Une page web d'exercices pour la formation Bio par Nature. Les participants l'ouvrent avec un simple lien, sans aucun compte. Les réponses écrites sont évaluées par l'IA via un petit proxy qui porte **ta** clé API Anthropic.

Deux morceaux :

- `index.html` : la page, à héberger sur GitHub Pages.
- `worker.js` : le proxy, à héberger sur Cloudflare Workers. Il garde la clé API côté serveur.

## Règle de sécurité, la seule qui compte

La clé API ne va **jamais** dans `index.html`. Si elle est dans la page, n'importe qui la lit dans le code source et peut la dépenser à ta place. La clé vit uniquement dans le secret du Worker.

## 1. Publier la page sur GitHub Pages

1. Crée un dépôt GitHub (public ou privé avec Pages activé) et ajoute `index.html` à la racine.
2. Settings → Pages → Source : branche `main`, dossier `/root` → Save.
3. Au bout d'une minute, GitHub te donne l'URL, du type `https://<toncompte>.github.io/<depot>/`.

## 2. Déployer le proxy sur Cloudflare

1. Va sur cloudflare.com, crée un compte gratuit, puis Workers & Pages → Create → Worker.
2. Remplace le code par le contenu de `worker.js`, puis Deploy.
3. Dans le Worker, Settings → Variables and Secrets :
   - Secret `ANTHROPIC_API_KEY` = ta clé Anthropic (elle commence par `sk-ant-...`). Tu la crées sur console.anthropic.com.
   - Variable `MODEL` (optionnel) = `claude-haiku-5-5` pour un retour rapide et peu coûteux, ou un modèle plus fort comme `claude-sonnet-5-5`. Vérifie l'identifiant exact sur docs.anthropic.com si besoin.
   - Variable `ALLOWED_ORIGIN` (optionnel mais conseillé) = l'URL exacte de ta page GitHub Pages, pour que seul ton site puisse appeler le proxy.
4. Copie l'URL du Worker, du type `https://atelier-bio.<ton-sous-domaine>.workers.dev`.

## 3. Relier les deux

Ouvre `index.html`, et en haut du script remplace :

```js
const API_ENDPOINT = "";
```

par l'URL de ton Worker :

```js
const API_ENDPOINT = "https://atelier-bio.ton-sous-domaine.workers.dev";
```

Commit, push. C'est prêt : partage le lien GitHub Pages aux participants.

## Coût et limites

- Chaque évaluation est un petit appel à l'API Anthropic sur ton compte. En `claude-haiku-5-5`, c'est quelques centimes au total pour un atelier.
- Le proxy est public. Pour un atelier c'est négligeable, mais pour durcir : renseigne `ALLOWED_ORIGIN`, et active une règle de limitation de débit (rate limiting) dans Cloudflare.
- Si `API_ENDPOINT` est vide ou si le proxy ne répond pas, la page ne casse pas : chaque exercice écrit affiche alors ses repères, et le bouton « Copier toutes mes réponses » permet de te transmettre le travail.

## Alternative tout-en-un

Si tu préfères ne pas séparer page et proxy, tu peux tout mettre sur Vercel ou Netlify : la page en statique et le proxy en fonction serverless dans le même dépôt, avec la clé en variable d'environnement. Le principe reste le même, la clé ne touche jamais le navigateur.
