# Windows ISO Uploader

Une application web pour partager des ISO Windows personnalisés, construite avec Express.js, EJS et MongoDB.

## Fonctionnalités

- Upload d'ISO Windows personnalisés
- Pas besoin de compte utilisateur (utilise des cookies pour sauvegarder le nom d'utilisateur)
- Commentaires sur les ISO
- Système de signalement
- Interface d'administration pour gérer les ISO et les signalements
- Design moderne et responsive

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (local ou distant)

## Installation

1. Clonez ce dépôt :
   ```
   git clone https://github.com/ArizakiDev/WinIsoTemplate
   cd WinIsoTemplate
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Configurez votre base de données MongoDB dans `config.json`

4. Créez un dossier uploads :
   ```
   mkdir uploads
   ```

5. Démarrez l'application :
   ```
   npm start
   ```
   
   Pour le développement, utilisez :
   ```
   npm run dev
   ```

## Configuration

Modifiez le fichier `config.json` pour configurer l'application :

```json
{
  "port": 3000,
  "mongoURI": "mongodb://localhost:27017/windowsIsoUploader",
  "admin": {
    "username": "admin",
    "password": "adminpass123"
  },
  "uploadDir": "uploads",
  "maxFileSize": 5368709120,
  "allowedExtensions": [".iso"],
  "cookieSecret": "windowsIsoUploaderSecret2024"
}
```

## Structure de l'application

- `main.js` - Point d'entrée de l'application
- `models/` - Modèles MongoDB
- `views/` - Templates EJS
  - `layouts/` - Layout principal
  - `partials/` - Composants partiels
  - `admin/` - Interface d'administration
- `config.json` - Configuration de l'application
- `uploads/` - Répertoire où les ISO sont stockés

## Sécurité

- Identifiants administrateur configurables
- Filtrage des noms d'utilisateur pour éviter les liens
- Validation des fichiers (uniquement .iso)
- Limite de taille de fichier (5GB par défaut)

## Licence

MIT 
