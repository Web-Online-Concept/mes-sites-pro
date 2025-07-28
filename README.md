# Mes Sites Pro - Gestionnaire de Favoris

Une application web moderne pour organiser et gérer vos sites favoris avec des onglets personnalisables, développée avec Next.js et déployable sur Vercel.

## 🌟 Fonctionnalités

- **🔐 Authentification sécurisée** : Inscription et connexion avec JWT
- **📑 Gestion par onglets** : Organisez vos favoris dans différents onglets
- **🔗 Gestion des favoris** : Ajout, modification et suppression de liens
- **📸 Aperçu automatique** : Capture d'écran automatique des sites
- **🔄 Drag & Drop** : Réorganisez vos favoris par glisser-déposer
- **💾 Export/Import** : Sauvegardez et restaurez vos favoris
- **📱 Responsive** : Interface adaptée mobile et desktop

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- PostgreSQL (local ou cloud)
- Compte Vercel (pour le déploiement)

### Configuration locale

1. **Cloner le projet**
```bash
cd E:\github\mes-sites-pro
npm install
```

2. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer .env.local avec vos valeurs
```

3. **Configurer la base de données**

Pour PostgreSQL local :
```bash
# Créer la base de données
createdb bookmarks_manager

# Générer le client Prisma
npx prisma generate

# Créer les tables
npx prisma migrate dev --name init
```

Pour Vercel Postgres ou Supabase, suivez leurs documentations respectives.

4. **Lancer le développement**
```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 📦 Déploiement sur Vercel

### 1. Préparer la base de données

**Option A : Vercel Postgres**
1. Dans votre dashboard Vercel, créez une base de données Postgres
2. Copiez l'URL de connexion

**Option B : Supabase**
1. Créez un projet sur supabase.com
2. Récupérez l'URL de connexion PostgreSQL

### 2. Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Suivre les instructions
```

### 3. Configurer les variables d'environnement

Dans le dashboard Vercel, ajoutez ces variables :
- `DATABASE_URL` : URL de votre base de données
- `JWT_SECRET` : Clé secrète (générer avec `openssl rand -base64 32`)
- `SCREENSHOT_API_KEY` : (optionnel) Clé API pour les captures d'écran

### 4. Initialiser la base de données

```bash
# En production
npx prisma migrate deploy
```

## 🔧 Configuration

### Base de données

Le projet utilise Prisma comme ORM. Le schéma est défini dans `prisma/schema.prisma`.

### Capture d'écran

Par défaut, l'application génère des images OG simples. Pour de vraies captures d'écran, configurez un service externe :

1. Créez un compte sur [APIFlash](https://apiflash.com/) ou [Screenshot API](https://screenshotapi.net/)
2. Ajoutez votre clé API dans `SCREENSHOT_API_KEY`

## 📱 Utilisation

### Première connexion

1. Accédez à `/register` pour créer un compte
2. Connectez-vous avec vos identifiants
3. Un onglet "Général" est créé automatiquement

### Gestion des favoris

- **Ajouter** : Cliquez sur "Ajouter un favori"
- **Modifier** : Cliquez sur "Modifier" sur une carte
- **Supprimer** : Cliquez sur l'icône poubelle
- **Réorganiser** : Glissez-déposez les cartes

### Export/Import

- **Export** : Télécharge un fichier JSON avec tous vos favoris
- **Import** : Charge un fichier JSON pour ajouter des favoris

## 🛠️ Technologies utilisées

- **Frontend** : Next.js, React, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL + Prisma
- **Authentification** : JWT
- **Drag & Drop** : React Beautiful DnD
- **Déploiement** : Vercel

## 📂 Structure du projet

```
E:\github\mes-sites-pro\
├── components/          # Composants React
├── lib/                # Utilitaires (auth, prisma)
├── pages/              # Pages et API
│   ├── api/           # Routes API
│   └── ...            # Pages de l'app
├── prisma/            # Schéma de base de données
├── public/            # Fichiers statiques
└── styles/            # Fichiers CSS
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT sécurisés
- Protection CSRF
- Headers de sécurité configurés

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 🆘 Support

Pour toute question ou problème :
1. Consultez la documentation
2. Ouvrez une issue sur GitHub
3. Contactez le support

---

Développé avec ❤️ pour organiser vos liens favoris efficacement.