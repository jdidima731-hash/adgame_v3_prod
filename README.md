# AdGame Pro — Plateforme Interactive de Marketing & Engagement

## Stack
- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend** : Express + tRPC v11 + Prisma ORM
- **Base de données** : PostgreSQL 14+
- **Auth** : Sessions cookie httpOnly + bcryptjs
- **Carte** : OpenStreetMap (Leaflet)
- **UI** : Dark mode, responsive mobile

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### 1. Variables d'environnement

```bash
# Déjà créés — vérifiez et adaptez si besoin
# .env             → backend
# client/.env      → frontend
```

Éditez `.env` à la racine :
```env
DATABASE_URL="postgresql://adgame:adgame@localhost:5432/adgame"
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SESSION_SECRET=changez-moi-en-production-chaine-aleatoire-64-chars
```

### 2. Créer la base de données PostgreSQL

```sql
-- Dans psql ou pgAdmin :
CREATE USER adgame WITH PASSWORD 'adgame';
CREATE DATABASE adgame OWNER adgame;
GRANT ALL PRIVILEGES ON DATABASE adgame TO adgame;
```

### 3. Installer les dépendances backend

```bash
# À la racine du projet
npm install --legacy-peer-deps
```

### 4. Générer le client Prisma et créer les tables

```bash
npx prisma generate
npx prisma db push
```

### 5. Injecter les données de démonstration

```bash
npx tsx server/seed.ts
```

### 6. Lancer le backend

```bash
npx tsx watch server/index.ts
# → http://localhost:3001
```

### 7. Installer et lancer le frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe | Dashboard |
|------|-------|--------------|-----------|
| Admin | admin@adgame.com | Admin123! | `/admin` |
| Annonceur | advertiser@adgame.com | Advertiser123! | `/advertiser/dashboard` |
| Partenaire | partner@adgame.com | Partner123! | `/partner/dashboard` |
| Utilisateur | user@adgame.com | User123! | `/dashboard` |

> **Dev uniquement** : http://localhost:5173/test-roles — connexion rapide en un clic

---

## 🗄️ Base de données (20 tables)

```
users                  → Comptes (admin / advertiser / partner / user)
sessions               → Sessions auth (cookie httpOnly, 1 an)
password_reset_tokens  → Tokens reset mot de passe (expiry 1h)
advertiser_profiles    → Profils annonceurs (validation admin requise)
cities                 → Villes de diffusion
games                  → Jeux publicitaires (quiz, wheel, scratch, memory…)
game_cities            → Relation games ↔ cities
ads                    → Publicités vidéo
participations         → Participations aux jeux
offers                 → Offres promo & codes
partners               → Commerces partenaires
boxes                  → Boxes Android (écrans publicitaires)
broadcast_fluxes       → Flux HLS de diffusion
broadcast_flux_cities  → Flux ↔ villes
broadcast_flux_ads     → Flux ↔ publicités (avec ordre)
broadcast_flux_games   → Flux ↔ jeux
messages               → Messagerie interne + messages box
reservations           → Réservations clients
notifications          → Notifications in-app
subscriptions          → Abonnements (Starter / Pro / Enterprise)
```

### Commandes Prisma utiles

```bash
npx prisma studio              # Interface web pour voir les données
npx prisma migrate dev --name init   # Créer une migration
npx prisma migrate deploy      # Appliquer migrations en production
npx prisma migrate reset --force && npx tsx server/seed.ts  # Reset complet
```

---

## 🏗️ Architecture

```
adgame/
├── .env                       # Variables d'environnement (backend)
├── package.json               # Dépendances backend + scripts npm
├── tsconfig.server.json       # Config TypeScript backend
├── prisma/
│   └── schema.prisma          # Schéma DB (20 tables)
├── server/
│   ├── index.ts               # Express + sessions + cleanup auto
│   ├── prisma.ts              # Singleton PrismaClient
│   ├── trpc.ts                # Context + procedures (auth guards)
│   ├── seed.ts                # Données de démonstration
│   └── routers/
│       ├── index.ts           # Assemblage AppRouter
│       ├── auth.ts            # Login / register / reset / logout
│       ├── games.ts           # CRUD jeux + participations
│       ├── ads.ts             # CRUD publicités
│       ├── admin.ts           # Panel admin complet
│       └── misc.ts            # Offres, partenaires, messages, notifs,
│                              # réservations, broadcast, abonnements,
│                              # social addon, profils annonceurs
├── shared/
│   ├── const.ts               # Constantes partagées client/serveur
│   └── types.ts               # Types partagés
└── client/
    ├── .env                   # Variables d'environnement (frontend)
    └── src/
        ├── pages/             # 38 pages
        ├── components/        # DashboardLayout, VideoPlayer, MiniPlayer…
        ├── contexts/          # AuthContext, ThemeContext (dark mode)
        └── lib/               # trpc client
```

---

## 🔐 Sécurité

| Mesure | Implémentation |
|--------|----------------|
| Sessions | Cookie `httpOnly` + `sameSite:lax` + 1 an |
| Secret cookie | `SESSION_SECRET` via `cookieParser` |
| Mots de passe | bcrypt 10 rounds |
| Utilisateurs bloqués | Check `isBlocked` dans `protectedProcedure` + login |
| Annonceurs non validés | Check `validationStatus` dans `advertiserProcedure` |
| Reset password | Token aléatoire 32 bytes, expire en 1h, stocké en DB |
| Sessions expirées | Nettoyage automatique toutes les heures |
| Pages de test | `/test-roles` et `/test-login` inaccessibles en production |

---

## 📦 Build production

```bash
# Frontend
cd client && npm run build
# → client/dist/ servi automatiquement par Express

# Backend
npm run build
# → dist/server/index.js

# Lancer en production
NODE_ENV=production node dist/server/index.js
```

### Variables d'environnement production

```env
DATABASE_URL="postgresql://user:pass@host:5432/adgame"
NODE_ENV=production
CLIENT_URL=https://votre-domaine.tn
PORT=3001
SESSION_SECRET=chaine-aleatoire-securisee-64-caracteres-minimum

# Email (obligatoire pour reset password en production)
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@votre-domaine.tn
```

---

## 🔧 Intégrations futures

| Service | Où l'ajouter | Guide |
|---------|-------------|-------|
| **Emails** | `server/routers/auth.ts` → `forgotPassword` | `resend` ou `nodemailer` |
| **Upload vidéo** | `server/routers/admin.ts` → `uploadVideo` | Cloudinary ou S3 |
| **Paiements** | Nouveau router `payments.ts` | Stripe ou Paymee (Tunisie) |
| **Push notifications** | DashboardLayout + nouveau router | Firebase FCM |
