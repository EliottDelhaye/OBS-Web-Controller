# 🎬 OBS Controller

> Application web moderne pour contrôler OBS Studio depuis votre réseau local

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple.svg)](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)

Contrôlez OBS Studio facilement depuis n'importe quel appareil de votre réseau local avec une interface web moderne et responsive.

## ✨ Fonctionnalités

### 🎮 Contrôle OBS
- **Changement de scènes instantané** via boutons personnalisés
- **Interface tactile optimisée** pour mobile et tablette
- **Feedback visuel** en temps réel
- **Connexion WebSocket** stable et rapide

### 🎨 Interface moderne
- **Thème sombre** professionnel
- **Design responsive** adaptatif
- **Menu roue crantée** pour la configuration
- **Titre personnalisable** de l'application

### 📱 PWA (Progressive Web App)
- **Installation native** sur iPhone/iPad
- **Mode offline** avec cache automatique
- **Mises à jour automatiques**
- **Expérience app native**

### ⚙️ Gestion avancée
- **CRUD complet** des boutons (Créer, Lire, Modifier, Supprimer)
- **Images personnalisées** pour chaque bouton
- **Configuration centralisée** via menu
- **Sauvegarde persistante** des paramètres

## 📋 Prérequis

### Sur votre PC Windows :

1. **Node.js** (version 16 ou supérieure)
   - Téléchargez depuis : https://nodejs.org/
   - Vérifiez l'installation : `node --version`

2. **OBS Studio** avec le plugin WebSocket
   - OBS Studio 28+ (WebSocket intégré)
   - Ou installez obs-websocket pour les versions antérieures

## 🚀 Installation

### 1. Configuration d'OBS WebSocket

1. Ouvrez OBS Studio
2. Allez dans **Outils → obs-websocket Settings** (ou **Outils → Paramètres WebSocket**)
3. Activez le serveur WebSocket
4. Notez le port (par défaut : 4455)
5. Définissez un mot de passe si souhaité (recommandé pour la sécurité)

### 2. Installation de l'application

1. **Téléchargez** ou clonez ce projet dans un dossier
2. **Ouvrez un terminal** dans le dossier du projet
3. **Installez les dépendances** :
   ```bash
   npm install
   ```

### 3. Configuration OBS (si authentification activée)

Si vous avez défini un mot de passe dans OBS WebSocket :

1. **Lancez l'application** (voir étape suivante)
2. **Cliquez sur la roue crantée** ⚙️ en haut à droite
3. **Sélectionnez "Configuration OBS"**
4. **Saisissez votre mot de passe** OBS WebSocket
5. **Cliquez "Sauvegarder et reconnecter"**

L'application se reconnectera automatiquement avec l'authentification.

## ▶️ Utilisation

### 1. Démarrage du serveur

```bash
npm start
```

Ou pour le développement (redémarrage automatique) :
```bash
npm run dev
```

### 2. Accès à l'interface

- **Sur le même PC** : http://localhost:3000
- **Depuis le réseau local** : http://[IP-DU-PC]:3000

Pour connaître l'IP de votre PC :
```bash
ipconfig
```
Recherchez l'adresse IPv4 de votre carte réseau principale.

### 3. Première utilisation

1. **Vérifiez le statut** : L'indicateur en haut à droite doit afficher "OBS Connecté"
2. **Testez les boutons** : Cliquez sur "Scène principale" ou "Écran partagé"
3. **Personnalisez** : Ajoutez vos propres boutons avec le bouton "Ajouter un bouton"

### 4. Installation PWA sur iPhone/iPad 📱

Pour installer l'application sur votre iPhone ou iPad comme une vraie app :

1. **Ouvrez Safari** sur votre iPhone/iPad
2. **Allez sur** `http://[IP-DU-PC]:3000`
3. **Tapez sur Partage** → **"Sur l'écran d'accueil"**
4. **L'app s'installe** avec une icône sur votre écran d'accueil !

📖 **Guide détaillé** : Voir `PWA-iOS-GUIDE.md` pour les instructions complètes

## 🎮 Gestion des boutons

### Ajouter un bouton

1. Cliquez sur **"Ajouter un bouton"**
2. Remplissez :
   - **Nom du bouton** : Le texte affiché sur le bouton
   - **Nom de la scène OBS** : Le nom exact de la scène dans OBS
   - **URL de l'image** : Chemin vers une image (optionnel)

### Utiliser des images personnalisées

Placez vos images dans le dossier `public/images/` et référencez-les ainsi :
- `/images/mon_image.jpg`
- `/images/webcam.png`
- etc.

### Modifier/Supprimer un bouton

- **Modifier** : Survolez un bouton et cliquez sur l'icône crayon ✎
- **Supprimer** : Survolez un bouton et cliquez sur l'icône × 

## 🌐 Accès réseau local

### Configuration Windows Firewall

1. Ouvrez **Panneau de configuration → Système et sécurité → Pare-feu Windows Defender**
2. Cliquez sur **Autoriser une application ou fonctionnalité...**
3. Cliquez **Modifier les paramètres** puis **Autoriser une autre application...**
4. Ajoutez Node.js ou autorisez le port 3000

### Ou via PowerShell (en tant qu'administrateur) :

```powershell
New-NetFirewallRule -DisplayName "OBS Controller" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
```

## 🛠️ Dépannage

### "OBS Déconnecté"
- Vérifiez qu'OBS Studio est ouvert
- Vérifiez que WebSocket est activé dans OBS
- Vérifiez le port (par défaut 4455)
- Si vous avez un mot de passe OBS, configurez-le via ⚙️ → "Configuration OBS"
- Redémarrez l'application

### "Erreur lors du changement de scène"
- Vérifiez que le nom de la scène correspond exactement à celui dans OBS
- Les noms de scènes sont sensibles à la casse

### L'application n'est pas accessible depuis un autre appareil
- Vérifiez l'IP de votre PC avec `ipconfig`
- Vérifiez que le firewall autorise le port 3000
- Assurez-vous que les appareils sont sur le même réseau

### Images ne s'affichent pas
- Vérifiez que le fichier image existe dans `public/images/`
- Utilisez des formats supportés : JPG, PNG, SVG, GIF
- Vérifiez les permissions de lecture du fichier

## 📁 Structure du projet

```
obs-controller/
├── server.js              # Serveur Express principal
├── package.json           # Dépendances et scripts
├── data/
│   └── buttons.json       # Base de données des boutons
└── public/
    ├── index.html         # Interface web
    ├── styles.css         # Styles CSS
    ├── script.js          # Logique JavaScript
    └── images/            # Dossier des images
        └── default.png    # Image par défaut
```

## 🔧 API REST

L'application expose une API REST pour les intégrations avancées :

- `GET /api/buttons` - Liste tous les boutons
- `POST /api/buttons` - Ajoute un nouveau bouton
- `PUT /api/buttons/:id` - Modifie un bouton
- `DELETE /api/buttons/:id` - Supprime un bouton
- `POST /api/change-scene` - Change de scène OBS
- `GET /api/obs-status` - Statut de la connexion OBS

## 🚀 Roadmap

- [ ] Contrôle du volume audio
- [ ] Démarrage/arrêt d'enregistrement  
- [ ] Changement de sources
- [ ] Prévisualisation des scènes
- [ ] Authentification utilisateur
- [ ] Thèmes personnalisés
- [ ] Raccourcis clavier
- [ ] Support multi-langues

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. 🍴 Fork le projet
2. 🌟 Créer une branche pour votre fonctionnalité
3. 💾 Commit vos changements
4. 📤 Push vers la branche
5. 🔄 Ouvrir une Pull Request

## 📝 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## ⭐ Support

Si ce projet vous aide, n'hésitez pas à lui donner une étoile ! ⭐

---

**Développé avec ❤️ pour la communauté OBS Studio**