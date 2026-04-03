# TP Vue.js

Application web réalisée dans le cadre d’un **travail pratique** : interface **Vue.js 3**, UI **Vuetify 4**, petite **API Express** avec **PostgreSQL** (Prisma) pour les avis et un back-office protégé.

**Dépôt :** [github.com/AlexandreAnc/TP-VueJS](https://github.com/AlexandreAnc/TP-VueJS)

---

## Sommaire

- [Stack technique](#stack-technique)
- [Arborescence du projet](#arborescence-du-projet)
- [Fichiers et dossiers importants](#fichiers-et-dossiers-importants)
- [Développement local](#développement-local)
- [Variables d’environnement](#variables-denvironnement)
- [Sécurité API (avis admin)](#sécurité-api-avis-admin)
- [Déploiement (Docker, proxy, DNS, reCAPTCHA)](#déploiement-docker-proxy-dns-recaptcha)
- [Makefile (production &amp; dev DB)](#makefile-production--dev-db)
- [Tests &amp; CI](#tests--ci)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Front** | [Vue.js 3](https://vuejs.org/) (Composition API), [Vue Router 5](https://router.vuejs.org/) |
| **UI** | [Vuetify 4](https://vuetifyjs.com/), [Material Design Icons](https://pictogrammers.com/library/mdi/) (`@mdi/font`) |
| **Build** | [Vite 8](https://vitejs.dev/) |
| **API** | [Node.js](https://nodejs.org/) 20+, [Express 5](https://expressjs.com/), [Prisma 6](https://www.prisma.io/) |
| **Base de données** | [PostgreSQL 16](https://www.postgresql.org/) (avis, modération back-office) |
| **Conteneurs** | [Docker](https://www.docker.com/) / Docker Compose (prod : front Nginx + API + Postgres) |
| **Qualité** | [Vitest](https://vitest.dev/), couverture de code, formatage [oxfmt](https://github.com/oxc-project/oxc) |

---

## Arborescence du projet

```
TP-VueJS/
├── api/                    # API Express (Prisma, routes /api/…)
├── deployment/             # Docker Compose (dev DB, prod), Dockerfile front
├── public/                 # Assets statiques Vite
├── src/                    # Application Vue (voir détail ci-dessous)
├── .github/workflows/      # CI (tests + déploiement SSH)
├── Makefile                # Raccourcis docker / prod
├── package.json            # Scripts front (racine)
├── vite.config.js
└── vitest.config.js
```

### Dossier `src/` (front)

| Dossier / fichier | Rôle |
|-------------------|------|
| `main.js` | Point d’entrée : Vuetify, thème clair/sombre, styles globaux, `@mdi/font` |
| `App.vue` | Layout : barre de navigation, `<RouterView>`, pied de page |
| `assets/main.css` | Variables CSS, cartes `.page-card`, mode sombre (`html.theme-dark`) |
| `components/` | `NavBar.vue`, `AppFooter.vue` (navigation, thème, auth) |
| `views/` | Pages par route : accueil, fonctionnalités, avis, login, back-office |
| `router/` | `buildRouter.js` (routes, garde `requiresAuth`, View Transitions), `index.js` (instance prod) |
| `composables/` | `useAuth.js`, `useFeaturedFeed.js`, `useAppTheme.js` (logique réutilisable) |
| `utils/` | `apiBase.js` (`apiUrl`), `loadRecaptchaScript.js` (reCAPTCHA v3 login) |
| `config/` | `recaptcha.js`, `themeStorage.js` (clés / stockage thème) |
| `test/` | `setupVitest.js`, helper Vuetify pour les tests |

Les tests unitaires sont en général **à côté du code** (`*.spec.js`, `*.test.js`).

---

## Fichiers et dossiers importants

- **`deployment/docker-compose.prod.yml`** — Orchestration **production** : services `web` (Nginx + fichiers statiques du build Vue), `api` (Express), `postgres` (données persistantes dans un volume Docker).
- **`deployment/Dockerfile`** — Image **front** : build Vite (`pnpm build`) puis image **nginx:alpine** qui sert `dist/`. Les variables `VITE_*` sont injectées **au moment du build** (pas au runtime).
- **`api/Dockerfile`** — Image **API** : install des deps, `prisma generate`, exécution `node src/index.mjs`.
- **`deployment/docker-compose.dev.yml`** — **PostgreSQL uniquement** pour le dev local (port hôte **5433** pour éviter le conflit avec un Postgres local sur 5432).
- **`api/prisma/`** — Schéma et client Prisma ; la table des avis est utilisée par l’API et le back-office.
- **`api/src/adminToken.mjs`** — Jeton admin signé (HMAC) et middleware `requireAdmin` sur les routes sensibles des avis (voir [Sécurité API (avis admin)](#sécurité-api-avis-admin)).
- **`.env` / `.env.development`** — Secrets et config locale (voir section variables). Les fichiers sensibles sont listés dans `.gitignore`.

---

## Développement local

Prérequis : **Node.js** 20+ ou 22+, **pnpm**, et optionnellement **Docker** pour Postgres.

```bash
pnpm install
pnpm install --dir api
```

1. **Base Postgres (recommandé)**  
   ```bash
   make dev-db-up
   # ou : pnpm dev:db
   ```  
   Puis configurer `DATABASE_URL` dans `api/.env.development` (voir `docker-compose.dev.yml` : utilisateur `tpvuejs`, mot de passe `devpass`, port **5433**).

2. **API**  
   ```bash
   pnpm dev:api
   ```

3. **Front** (proxy Vite vers l’API sur `/api`)  
   ```bash
   pnpm dev
   ```

4. **Tests**  
   ```bash
   pnpm test
   pnpm test:coverage
   ```

---

## Variables d’environnement

### Front (racine, préfixe `VITE_`)

| Variable | Usage |
|----------|--------|
| `VITE_API_URL` | URL de base de l’API en prod (ex. `https://api.exemple.fr`). Vide en dev → chemins relatifs `/api` via proxy Vite. |
| `VITE_RECAPTCHA_SITE_KEY` | Clé **publique** reCAPTCHA v3 (login admin). |
| `VITE_RECAPTCHA_DEV_BYPASS` | En dev uniquement : `1` pour ne pas charger le widget (avec `RECAPTCHA_SKIP_VERIFY=1` côté API). |

### API (`api/.env` ou `api/.env.development`)

| Variable | Usage |
|----------|--------|
| `DATABASE_URL` | Connexion PostgreSQL (Prisma). |
| `PORT` | Port d’écoute (souvent `3000`). |
| `RECAPTCHA_SECRET_KEY` | Clé **secrète** Google (vérification du jeton login). |
| `RECAPTCHA_SKIP_VERIFY` | `1` **uniquement en non-production** pour les tests locaux. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Identifiants back-office (défaut `admin` / `admin` si non définis). |
| `ADMIN_SESSION_SECRET` | **Obligatoire en production** : phrase secrète pour signer le jeton admin (après login). En dev / tests, une valeur par défaut est utilisée si absent. |

---

## Sécurité API (avis admin)

L’interface **back-office** (liste complète des avis, mise en avant, suppression) ne suffit pas à sécuriser l’API : il faut que le **serveur** refuse les appels non authentifiés.

**Routes ouvertes** (sans jeton) :

- `GET /api/avis/public` — avis publiés (« à la une »), pour la page Avis.
- `POST /api/avis` — soumission d’un **nouvel** avis (formulaire visiteur).

**Routes réservées à l’admin** — elles exigent l’en-tête HTTP  
`Authorization: Bearer <jeton>` (jeton obtenu **après** un login réussi) :

- `GET /api/avis` — liste **tous** les avis (y compris non validés).
- `PATCH /api/avis/:id` — modifier le statut « à la une » (`whitelisted`).
- `DELETE /api/avis/:id` — supprimer un avis.

Sans jeton valide, l’API répond **401** sur ces trois routes.

**Comment ça marche (simple)** :

1. **`POST /api/auth/login`** : après vérification des identifiants (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) et de **reCAPTCHA v3**, l’API renvoie un **jeton** signé (HMAC-SHA256 avec `ADMIN_SESSION_SECRET`), contenant une date d’expiration (environ 24 h). Aucune session en base : le serveur recalcule la signature à chaque requête.
2. **Front** (`src/composables/useAuth.js`) : le jeton est stocké en **localStorage** ; la vue back-office envoie `Authorization: Bearer …` sur les `fetch` concernés (`authHeaders()`).
3. **Code côté API** : `api/src/adminToken.mjs` (création / vérification du jeton, middleware `requireAdmin`), monté sur les routes sensibles dans `api/src/app.mjs`.

### Jeton `Bearer` :

- **Transport** : le schéma **`Authorization: Bearer <jeton>`** est le mode courant pour envoyer un secret d’accès dans une requête HTTP ; le client (back-office) place le jeton après `Bearer `, l’API le lit dans `requireAdmin` et le valide avant d’exécuter la route.

- **Ce n’est pas un JWT** : il n’y a pas de bibliothèque type `jsonwebtoken`. Le projet utilise un **format compact maison** : une chaîne `payload.signature` avec un **seul** point de séparation.

- **Génération** (`createAdminToken` dans `adminToken.mjs`) :
  1. **Payload** : objet JSON `{"role":"admin","exp":<timestamp>}` où `exp` = maintenant + **24 h** (durée de vie).
  2. Encodage du JSON en **base64url** → première partie du jeton.
  3. **Signature** : **HMAC-SHA256** de cette chaîne (payload encodé), avec la clé **`ADMIN_SESSION_SECRET`**, résultat en **base64url** → deuxième partie.
  4. Jeton final : `base64url(payloadJson).base64url(hmac)` (implémentation via le module Node **`crypto`** : `createHmac('sha256', secret)`).

- **Vérification** : le serveur recoupe le jeton au `.`, recalcule le HMAC avec le même secret, compare la signature avec **`timingSafeEqual`** (évite les fuites par temps), décode le JSON et refuse si `role !== 'admin'` ou si `Date.now() > exp`.

- **Sans base de données de session** : tout ce qu’il faut est dans le jeton + le secret serveur ; changer `ADMIN_SESSION_SECRET` invalide d’un coup les jetons déjà émis.

En **production**, `ADMIN_SESSION_SECRET` est **obligatoire** au démarrage de l’API (`api/src/index.mjs`), sinon le processus quitte : évite de déployer avec la valeur de développement par défaut.

---

## Déploiement (Docker, proxy, DNS, reCAPTCHA)

### Vue d’ensemble

En **production**, trois services Docker Compose travaillent ensemble :

1. **`postgres`** — Base **PostgreSQL 16** (volume persistant `tp_vuejs_pgdata`). **Aucun port n’est publié sur l’hôte** : seuls `web` et `api` joignent Postgres sur le réseau interne Compose.
2. **`api`** — API **Node / Express** sur le port **3000** dans le conteneur, exposé sur la machine hôte en **`127.0.0.1:8011`** (écoute locale uniquement, pas d’exposition directe sur Internet).
3. **`web`** — **Nginx** sert les fichiers statiques du build **Vue** (port **80** dans le conteneur), mappé sur le port hôte **`8010`** (toutes interfaces dans le fichier Compose ; le reverse proxy de la machine pointe en pratique vers cette adresse).

Les noms de domaine et ports exacts côté **reverse proxy** sont indiqués en commentaire dans `deployment/docker-compose.prod.yml` :

- **Site public (front)** → `127.0.0.1:8010` (ex. `tp-vuejs.aanc.fr`).
- **API** → `127.0.0.1:8011` (ex. `api.tp-vuejs.aanc.fr`).

Sur le **serveur**, un **reverse proxy Nginx** (ou équivalent) termine le TLS et route :

- le trafic HTTP(S) du **front** vers le conteneur **web** ;
- le trafic de l’**API** vers le conteneur **api**.

Les conteneurs Docker n’ont pas besoin d’exposer Postgres : tout passe par l’API.

### DNS et domaine

- Le **nom de domaine** est enregistré chez **OVH**.
- La **résolution DNS** et les protections (proxy, règles, etc.) passent par **Cloudflare** (DNS « protégés » / gérés via Cloudflare devant l’infrastructure).

### reCAPTCHA v3 (login admin)

- Le **formulaire de connexion** du back-office utilise **Google reCAPTCHA v3** (score + action `login`).
- **Clé publique** : injectée dans le bundle front (`VITE_RECAPTCHA_SITE_KEY` au **build** de l’image `web`).
- **Clé secrète** : `RECAPTCHA_SECRET_KEY` dans l’environnement du service **`api`** au runtime ; l’API appelle l’endpoint **siteverify** de Google avant d’accepter le login.

### Déploiement automatisé (CI)

Le workflow **GitHub Actions** (branche `production`) se connecte en **SSH** au serveur, met à jour le dépôt Git, puis lance **Docker Compose** avec un fichier **`.env` à la racine du clone** si présent (`--env-file .env`) pour fournir notamment `POSTGRES_PASSWORD`, `ADMIN_SESSION_SECRET`, `RECAPTCHA_SECRET_KEY`, `VITE_RECAPTCHA_SITE_KEY`, etc.

---

## Makefile (production & dev DB)

Le **`Makefile`** à la racine évite de retaper les longues commandes `docker compose` et documente les usages courants. **Toujours lancer `make` depuis la racine du dépôt.**

| Cible | Effet |
|-------|--------|
| `make help` | Affiche l’aide des cibles |
| `make dev-db-up` | Démarre **Postgres** seul (dev), port hôte **5433** |
| `make dev-db-down` | Arrête le stack dev DB |
| `make dev-db-logs` | Logs en direct de Postgres (dev) |
| `make prod-up` | **Build + démarrage** du stack prod (`web` + `api` + `postgres`). Utilise `--env-file .env` **si** un fichier `.env` existe à la racine. |
| `make prod-down` | Arrête le stack prod |
| `make prod-build` | Rebuild des images sans forcément recréer les conteneurs comme `up` |
| `make prod-logs` | Logs de tous les services prod |
| `make prod-ps` | État des conteneurs (`docker compose ps`) |
| `make prod-prune-disk` | **À utiliser avec précaution** sur le VPS si le disque est plein : purge agressive du cache BuildKit et des images inutilisées, puis `docker system df` |

Pour la prod, définir au minimum **`POSTGRES_PASSWORD`** dans le `.env` à la racine (ou en variable d’environnement avant `make prod-up`).

---

## Tests & CI

- **`pnpm test`** — Suite Vitest (front + fichiers `api/src/*.test.mjs` selon config).
- **`.github/workflows/ci-production.yml`** — Sur la branche `production` : tests et couverture (lignes ≥ 70 % sur tous les fichiers), puis déploiement SSH décrit plus haut (un seul workflow, le déploiement ne s’exécute que si la CI passe).