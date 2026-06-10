# Déploiement — Gestock (Application React)

> **Dépôt GitHub :** [Gestock-AP3](https://github.com/ridou77/Gestock-AP3)  

**Application accessible en production à cette URL sans aucune autre manipulation nécéssaire:** [https://gestock-ap3.web.app](https://gestock-ap3.web.app)

Pour accéder à l'application en production, utiliser le compte admin suivant :

| Champ | Valeur |
|-------|--------|
| **Email** | `test.jury@gmail.com` |
| **Mot de passe** | `Test1234!` |

---

## Architecture de déploiement

```
┌──────────────────────┐    npm run build     ┌──────────────────┐   firebase deploy   ┌─────────────────────────┐
│  Code source React   │  ────────────────►  │   Build statique  │  ─────────────────► │  Firebase Hosting (CDN) │
│  (local / GitHub)    │                      │   (/dist ou /build)│                    │  gestock-ap3.web.app    │
└──────────────────────┘                      └──────────────────┘                      └─────────────────────────┘
```

L'application est une **Single Page Application (SPA)** React déployée sur **Firebase Hosting**, l'hébergement statique managé de Google. Firebase se charge de la distribution via son CDN mondial, du HTTPS automatique et de la gestion du routage.

---

## Ma procédure de déploiement

### Prérequis

- [Node.js](https://nodejs.org/) installé
- Un compte Google avec accès au projet Firebase `gestock-ap3`

### Étapes

**1. Installer Firebase CLI**

```bash
npm install -g firebase-tools
```

**2. Se connecter à Firebase**

```bash
firebase login
```

Une fenêtre de navigateur s'ouvre pour l'authentification Google.

**3. Initialiser le projet (première fois uniquement)**

```bash
firebase init hosting
```

Lors de l'initialisation, sélectionner :
- Le projet Firebase existant `gestock-ap3`
- Le dossier de build comme répertoire public (`build` ou `dist` selon la config)
- Réécriture de toutes les URLs vers `index.html` (obligatoire pour le routage React)

**4. Builder l'application**

```bash
npm run build
```

Génère les fichiers statiques optimisés dans le dossier de sortie.

**5. Déployer sur Firebase Hosting**

```bash
firebase deploy --only hosting
```

Une fois déployée, l'application est accessible à l'adresse :  
**[https://gestock-ap3.web.app](https://gestock-ap3.web.app)**

---

## Variables d'environnement

La configuration Firebase (clés API, identifiants du projet, etc.) est stockée dans un fichier **`.env.local`** à la racine du projet. Ce fichier est **intentionnellement exclu du dépôt** (listé dans `.gitignore`) pour ne pas exposer les clés publiquement.

Un fichier **`.env.example`** est fourni dans le dépôt pour documenter toutes les variables attendues :

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

> Pour déployer en local ou reconfigurer l'environnement, copier `.env.example` en `.env.local` et renseigner les valeurs correspondantes au projet Firebase.

```bash
cp .env.example .env.local
# Puis renseigner les valeurs dans .env.local
```

## Retranscription des schémas de base de données
<img width="1048" height="722" alt="image" src="https://github.com/user-attachments/assets/1600de96-9add-4931-a7cd-15fa01db4ffa" />
<img width="978" height="742" alt="image" src="https://github.com/user-attachments/assets/82a0e7e8-752f-4c65-ad32-b475d93dca02" />



---

## Accès à l'application

| Environnement | URL |
|--------------|-----|
| **Production** | [https://gestock-ap3.web.app](https://gestock-ap3.web.app) |
| **Local (dev)** | `http://localhost:3000` (via `npm start`) |

### Identifiants de test (épreuve)

Pour accéder à l'application en production, utiliser le compte suivant :

| Champ | Valeur |
|-------|--------|
| **Email** | `test.admin@gmail.com` |
| **Mot de passe** | `Test1234!` |

---

## Structure des fichiers liés au déploiement

```
Gestock-AP3/
├── .env.example          # Template des variables d'environnement (versionné)
├── .env.local            # Configuration réelle (NON versionné, à créer localement)
├── .firebaserc           # Référence au projet Firebase
├── firebase.json         # Configuration Firebase Hosting (règles de réécriture, etc.)
├── public/
└── src/
```

---

## Remarques de sécurité — Contexte d'épreuve

> **Ce déploiement est réalisé dans un cadre pédagogique (Épreuve BTS SIO E6 — Conception et développement d'applications) et illustre une procédure de déploiement standard.**
> 

| Bonne pratique | Détail |
|----------------|--------|
| `.env.local` ignoré par Git | Les clés Firebase ne sont pas exposées dans le dépôt |
| `.env.example` documenté | Les variables nécessaires sont explicitement listées pour faciliter la reprise du projet |
| HTTPS automatique | Firebase Hosting fournit un certificat SSL sans configuration manuelle |
| CDN mondial | Les assets sont distribués depuis des serveurs proches de l'utilisateur |

### Ce qui serait renforcé en production réelle 🔧

| Point | Amélioration |
|-------|-------------|
| **Règles Firebase Security Rules** | Configurer des règles strictes sur Firestore/Storage pour limiter les accès selon les rôles utilisateur |
| **CI/CD automatisé** | Mettre en place un pipeline GitHub Actions pour déclencher le build et le déploiement automatiquement à chaque push sur `main` |
| **Gestion des environnements** | Séparer les projets Firebase dev / staging / production |
| **Monitoring** | Activer Firebase Performance Monitoring et Crashlytics pour suivre la stabilité en production |

---

*Ce projet a été réalisé dans le cadre du BTS SIO — Épreuve E6 : Conception et développement d'applications.*
