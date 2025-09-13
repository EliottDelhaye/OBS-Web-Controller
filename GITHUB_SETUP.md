# 🚀 Guide de publication sur GitHub

## Étapes à suivre sur GitHub.com

### 1. Créer le repository
1. Aller sur [github.com](https://github.com)
2. Cliquer sur **"New repository"** (bouton vert)
3. Remplir les informations :
   - **Repository name**: `obs-controller` (ou le nom de ton choix)
   - **Description**: `🎬 Modern web app to control OBS Studio from any device on your local network`
   - ☑️ **Public** (recommandé pour que d'autres puissent l'utiliser)
   - ❌ **Ne pas** ajouter README, .gitignore ou license (on les a déjà)
4. Cliquer **"Create repository"**

### 2. Connecter et push le code

GitHub te donnera des commandes, mais voici exactement ce qu'il faut faire :

```bash
# Remplace USERNAME et REPOSITORY par tes valeurs
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git branch -M main
git push -u origin main
```

**Exemple concret :**
```bash
git remote add origin https://github.com/eliott/obs-controller.git
git branch -M main
git push -u origin main
```

## 🎯 Commandes à exécuter dans ton terminal

Ouvre un terminal dans le dossier du projet et exécute :

```bash
cd "/Users/eliott/OBS Controler V2"

# Ajoute l'URL de ton repository GitHub (remplace par ton URL)
git remote add origin https://github.com/TON-USERNAME/TON-REPO.git

# Push vers GitHub
git branch -M main
git push -u origin main
```

## ✅ Vérification

Après le push, tu devrais voir :
- Tous les fichiers sur GitHub
- Le README.md affiché automatiquement
- Les badges et la description
- Le guide PWA-iOS-GUIDE.md

## 🏷️ Bonus : Créer un release

1. Sur GitHub, aller dans **Releases**
2. Cliquer **"Create a new release"**
3. Tag: `v1.0.0`
4. Title: `🎬 OBS Controller v1.0.0 - Initial Release`
5. Description: Copier les features du README
6. Publier

## 🌟 Promotion

Pour que ton projet soit découvert :
1. Ajouter des **topics** sur GitHub : `obs`, `websocket`, `pwa`, `nodejs`, `streaming`
2. Partager sur r/obs, Twitter, Discord OBS
3. Ajouter à awesome-obs ou autres listes

Ton projet est maintenant prêt pour GitHub ! 🚀