const express = require('express');
const cors = require('cors');
const OBSWebSocket = require('obs-websocket-js').default;
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const obs = new OBSWebSocket();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const BUTTONS_FILE = path.join(__dirname, 'data', 'buttons.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

async function initializeDatabase() {
    try {
        await fs.access(path.join(__dirname, 'data'));
    } catch {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    }

    try {
        await fs.access(BUTTONS_FILE);
    } catch {
        const initialButtons = [
            {
                id: 1,
                name: "Scène principale",
                scene: "Scene",
                image: "/images/default.svg"
            },
            {
                id: 2,
                name: "Écran partagé",
                scene: "Desktop",
                image: "/images/default.svg"
            }
        ];
        await fs.writeFile(BUTTONS_FILE, JSON.stringify(initialButtons, null, 2));
    }

    try {
        await fs.access(SETTINGS_FILE);
    } catch {
        const initialSettings = {
            appTitle: "OBS Controller",
            obsPassword: ""
        };
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(initialSettings, null, 2));
    }
}

async function loadButtons() {
    try {
        const data = await fs.readFile(BUTTONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des boutons:', error);
        return [];
    }
}

async function saveButtons(buttons) {
    try {
        await fs.writeFile(BUTTONS_FILE, JSON.stringify(buttons, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des boutons:', error);
        return false;
    }
}

async function loadSettings() {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        return { appTitle: "OBS Controller", obsPassword: "" };
    }
}

async function saveSettings(settings) {
    try {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
        return false;
    }
}

async function connectToOBS() {
    try {
        const settings = await loadSettings();
        const password = settings.obsPassword || '';
        
        if (password) {
            await obs.connect('ws://localhost:4455', password);
            console.log('Connexion à OBS WebSocket réussie (avec authentification)');
        } else {
            await obs.connect('ws://localhost:4455');
            console.log('Connexion à OBS WebSocket réussie (sans authentification)');
        }
    } catch (error) {
        console.error('Erreur de connexion à OBS:', error.message);
        if (error.message.includes('authentication')) {
            console.log('💡 Astuce: Il semble que OBS nécessite un mot de passe. Vous pouvez le configurer via l\'interface web.');
        }
    }
}

app.get('/api/buttons', async (req, res) => {
    const buttons = await loadButtons();
    res.json(buttons);
});

app.post('/api/buttons', async (req, res) => {
    const buttons = await loadButtons();
    const newButton = {
        id: Date.now(),
        name: req.body.name,
        scene: req.body.scene,
        image: req.body.image || '/images/default.svg'
    };
    buttons.push(newButton);
    
    if (await saveButtons(buttons)) {
        res.status(201).json(newButton);
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

app.put('/api/buttons/:id', async (req, res) => {
    const buttons = await loadButtons();
    const buttonIndex = buttons.findIndex(b => b.id === parseInt(req.params.id));
    
    if (buttonIndex === -1) {
        return res.status(404).json({ error: 'Bouton non trouvé' });
    }
    
    buttons[buttonIndex] = {
        ...buttons[buttonIndex],
        name: req.body.name || buttons[buttonIndex].name,
        scene: req.body.scene || buttons[buttonIndex].scene,
        image: req.body.image || buttons[buttonIndex].image
    };
    
    if (await saveButtons(buttons)) {
        res.json(buttons[buttonIndex]);
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

app.delete('/api/buttons/:id', async (req, res) => {
    const buttons = await loadButtons();
    const filteredButtons = buttons.filter(b => b.id !== parseInt(req.params.id));
    
    if (filteredButtons.length === buttons.length) {
        return res.status(404).json({ error: 'Bouton non trouvé' });
    }
    
    if (await saveButtons(filteredButtons)) {
        res.json({ message: 'Bouton supprimé avec succès' });
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

app.post('/api/change-scene', async (req, res) => {
    try {
        const { sceneName } = req.body;
        
        if (!obs.identified) {
            return res.status(500).json({ error: 'OBS WebSocket non connecté' });
        }
        
        await obs.call('SetCurrentProgramScene', { sceneName });
        res.json({ message: `Scène changée vers: ${sceneName}` });
    } catch (error) {
        console.error('Erreur lors du changement de scène:', error);
        res.status(500).json({ error: 'Erreur lors du changement de scène' });
    }
});

app.get('/api/obs-status', (req, res) => {
    res.json({ connected: obs.identified });
});

app.post('/api/obs-reconnect', async (req, res) => {
    try {
        console.log('Tentative de reconnexion à OBS...');
        try {
            await obs.disconnect();
        } catch (e) {
            // Ignore les erreurs de déconnexion
        }
        
        setTimeout(async () => {
            await connectToOBS();
            res.json({ message: 'Reconnexion initiée' });
        }, 500);
    } catch (error) {
        console.error('Erreur lors de la reconnexion:', error);
        res.status(500).json({ error: 'Erreur lors de la reconnexion' });
    }
});

app.get('/api/settings', async (req, res) => {
    const settings = await loadSettings();
    res.json(settings);
});

app.put('/api/settings', async (req, res) => {
    try {
        const currentSettings = await loadSettings();
        const newSettings = {
            ...currentSettings,
            appTitle: req.body.appTitle || currentSettings.appTitle,
            obsPassword: req.body.obsPassword !== undefined ? req.body.obsPassword : currentSettings.obsPassword
        };
        
        if (await saveSettings(newSettings)) {
            // Si le mot de passe OBS a changé, reconnecter
            if (req.body.obsPassword !== undefined && req.body.obsPassword !== currentSettings.obsPassword) {
                console.log('Reconnexion à OBS avec nouveau mot de passe...');
                try {
                    await obs.disconnect();
                } catch (e) {
                    // Ignore les erreurs de déconnexion
                }
                setTimeout(() => connectToOBS(), 1000); // Reconnecter après 1 seconde
            }
            res.json(newSettings);
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

async function startServer() {
    await initializeDatabase();
    await connectToOBS();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
        console.log(`Accessible sur le réseau local via http://[IP-LOCAL]:${PORT}`);
    });
}

obs.on('ConnectionClosed', () => {
    console.log('Connexion OBS fermée');
});

obs.on('ConnectionError', (err) => {
    console.error('Erreur de connexion OBS:', err);
});

startServer().catch(console.error);