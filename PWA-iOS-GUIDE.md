# 📱 Guide d'installation PWA sur iOS (iPhone/iPad)

## 🚀 Qu'est-ce qu'une PWA ?

L'application OBS Controller est maintenant une **Progressive Web App (PWA)** qui peut être installée sur votre iPhone ou iPad comme une vraie application native !

## ✨ Avantages de la PWA

- **Installation depuis Safari** - Pas besoin de l'App Store
- **Icône sur l'écran d'accueil** - Lancez l'app d'un tap
- **Mode plein écran** - Interface native sans barre d'adresse
- **Fonctionnement offline** - Cache automatique des ressources
- **Mises à jour automatiques** - Toujours la dernière version
- **Sécurisé** - Fonctionne en HTTPS sur votre réseau local

## 📋 Prérequis

- **iPhone/iPad** avec iOS 11.3+ 
- **Safari** (Chrome et autres navigateurs ne supportent pas l'installation PWA sur iOS)
- **Réseau local** - Votre iPhone/iPad doit être sur le même WiFi que votre PC

## 🔧 Installation sur iPhone/iPad

### 1. Connectez votre iPhone au même réseau WiFi

Assurez-vous que votre iPhone/iPad est connecté au même réseau WiFi que votre PC.

### 2. Ouvrez Safari et allez sur l'application

```
http://[IP-DE-VOTRE-PC]:3000
```

Pour connaître l'IP de votre PC :
- **Windows** : `ipconfig` dans l'invite de commande
- **Mac** : `ifconfig` dans le terminal

Exemple : `http://192.168.1.100:3000`

### 3. Installez l'application

1. **Tapez sur le bouton Partage** dans Safari (icône carré avec flèche vers le haut)
2. **Faites défiler vers le bas** et tapez sur **"Sur l'écran d'accueil"**
3. **Modifiez le nom** si souhaité (par défaut "OBS Controller")
4. **Tapez "Ajouter"** en haut à droite

### 4. Lancez l'application

- L'icône **OBS Controller** apparaît sur votre écran d'accueil
- **Tapez sur l'icône** pour lancer l'app en mode plein écran
- L'app fonctionne maintenant comme une application native !

## 🎮 Utilisation sur iOS

### Interface tactile optimisée

- **Boutons adaptatifs** - Taille minimum 44px pour iOS
- **Pas de zoom accidentel** - Zoom désactivé sur les formulaires
- **Gestes désactivés** - Pas de sélection de texte involontaire
- **Zone sûre** - Respect des encoches iPhone X+

### Fonctionnalités PWA

- **Cache automatique** - L'app fonctionne même si le réseau est lent
- **Notifications de mise à jour** - Banner automatique quand une nouvelle version est disponible
- **Mode landscape** - Interface adaptée à l'orientation paysage
- **Statut de connexion** - Indicateur en temps réel de la connexion OBS

## 🔄 Mise à jour de l'application

Les mises à jour se font automatiquement :

1. **Détection automatique** - L'app vérifie les mises à jour au démarrage
2. **Banner de notification** - Affichage d'un banner bleu "Nouvelle version disponible"
3. **Un tap pour mettre à jour** - Cliquez sur "Mettre à jour"
4. **Redémarrage automatique** - L'app se relance avec la nouvelle version

## 🛠️ Dépannage iOS

### L'option "Sur l'écran d'accueil" n'apparaît pas

- Vérifiez que vous utilisez **Safari** (pas Chrome/Firefox)
- Assurez-vous que l'application se charge correctement
- Rafraîchissez la page et réessayez

### L'application ne se connecte pas à OBS

- Vérifiez que votre iPhone est sur le **même réseau WiFi**
- Vérifiez que **OBS Studio est ouvert** sur votre PC
- Vérifiez que **WebSocket est activé** dans OBS
- Testez d'abord depuis Safari avant d'installer

### L'application est lente ou ne répond pas

- **Fermez et rouvrez** l'application
- Vérifiez la **qualité du WiFi**
- Redémarrez l'application sur votre PC si nécessaire

### L'icône ne s'affiche pas correctement

- L'icône peut prendre quelques secondes à se charger après l'installation
- Redémarrez votre iPhone si l'icône reste générique

## 📱 Compatibilité iOS

### Versions supportées
- **iOS 11.3+** - Installation PWA supportée
- **iOS 14+** - Expérience optimale
- **iPhone X+** - Support des zones sûres

### Appareils testés
- ✅ iPhone (tous modèles récents)
- ✅ iPad (tous modèles récents)
- ✅ iPad Pro avec orientation landscape

## 🔐 Sécurité et réseau local

### Pourquoi pas HTTPS ?

L'application fonctionne en HTTP sur le réseau local car :
- **Plus simple** - Pas de certificats à configurer
- **Sécurisé localement** - Trafic confiné au réseau local
- **iOS accepte PWA en HTTP** sur localhost/réseau local

### Firewall et réseau

- Assurez-vous que le **port 3000 est ouvert** sur votre PC
- Vérifiez que votre **routeur permet la communication** entre appareils
- Testez d'abord la connexion depuis le navigateur

## 🎯 Fonctionnalités futures

- **Notifications push** - Alertes pour les changements d'état OBS
- **Contrôles audio** - Réglage du volume depuis l'iPhone
- **Mode sombre** - Thème adaptatif selon les préférences iOS
- **Widgets iOS** - Contrôle rapide depuis l'écran d'accueil
- **Raccourcis Siri** - Commandes vocales pour changer de scène

---

**Profitez de votre OBS Controller sur iPhone/iPad !** 🎬📱