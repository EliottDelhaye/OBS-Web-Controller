const express = require('express');
const cors = require('cors');
const OBSWebSocket = require('obs-websocket-js').default;
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const obs = new OBSWebSocket();

// Variables pour Server-Sent Events
let sseClients = [];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'images'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB maximum
    },
    fileFilter: function (req, file, cb) {
        // Accepter seulement les images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers image sont acceptés!'), false);
        }
    }
});

const BUTTONS_FILE = path.join(__dirname, 'data', 'buttons.json');
const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

async function initializeDatabase() {
    try {
        await fs.access(path.join(__dirname, 'data'));
    } catch {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    }

    try {
        await fs.access(CATEGORIES_FILE);
    } catch {
        const initialCategories = [
            {
                id: 1,
                name: "Général",
                order: 1
            }
        ];
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(initialCategories, null, 2));
    }

    try {
        await fs.access(BUTTONS_FILE);
    } catch {
        const initialButtons = [
            {
                id: 1,
                name: "Scène principale",
                categoryId: 1,
                buttonOrder: 1,
                scene: "Scene",
                image: "/images/default.svg"
            },
            {
                id: 2,
                name: "Écran partagé",
                categoryId: 1,
                buttonOrder: 2,
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

async function loadCategories() {
    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        return [];
    }
}

async function saveCategories(categories) {
    try {
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des catégories:', error);
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
        // Déconnexion propre si déjà connecté
        if (obs.identified) {
            try {
                await obs.disconnect();
            } catch (e) {
                // Ignore les erreurs de déconnexion
            }
        }
        
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
        throw error; // Relancer l'erreur pour le système de reconnexion
    }
}

// Endpoint pour l'upload d'images
app.post('/api/upload-image', (req, res) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('Erreur multer:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Le fichier est trop volumineux (max 5MB)' });
            }
            return res.status(400).json({ error: err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Aucun fichier fourni' });
            }

            const imageUrl = `/images/${req.file.filename}`;
            res.json({
                imageUrl: imageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname
            });
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
        }
    });
});

app.get('/api/buttons', async (req, res) => {
    const buttons = await loadButtons();
    res.json(buttons);
});

app.post('/api/buttons', async (req, res) => {
    const buttons = await loadButtons();
    const newButton = {
        id: Date.now(),
        name: req.body.name,
        categoryId: parseInt(req.body.categoryId) || 1,
        buttonOrder: req.body.buttonOrder || 1,
        scene: req.body.scene,
        image: req.body.image || '/images/default.svg',
        favorite: req.body.favorite || false
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
        categoryId: req.body.categoryId !== undefined ? parseInt(req.body.categoryId) : (buttons[buttonIndex].categoryId || 1),
        buttonOrder: req.body.buttonOrder !== undefined ? req.body.buttonOrder : (buttons[buttonIndex].buttonOrder || 1),
        scene: req.body.scene || buttons[buttonIndex].scene,
        image: req.body.image || buttons[buttonIndex].image,
        favorite: req.body.favorite !== undefined ? req.body.favorite : (buttons[buttonIndex].favorite || false)
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

// Routes pour les catégories
app.get('/api/categories', async (req, res) => {
    const categories = await loadCategories();
    res.json(categories);
});

app.post('/api/categories', async (req, res) => {
    const categories = await loadCategories();
    const newCategory = {
        id: Math.max(...categories.map(c => c.id || 0), 0) + 1,
        name: req.body.name,
        order: req.body.order || Math.max(...categories.map(c => c.order || 0), 0) + 1
    };
    categories.push(newCategory);
    
    if (await saveCategories(categories)) {
        res.status(201).json(newCategory);
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const categories = await loadCategories();
    const categoryIndex = categories.findIndex(c => c.id === parseInt(req.params.id));
    
    if (categoryIndex === -1) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    categories[categoryIndex] = {
        ...categories[categoryIndex],
        name: req.body.name || categories[categoryIndex].name,
        order: req.body.order !== undefined ? req.body.order : categories[categoryIndex].order
    };
    
    if (await saveCategories(categories)) {
        res.json(categories[categoryIndex]);
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    const categoryId = parseInt(req.params.id);
    
    // Vérifier qu'il ne s'agit pas de la catégorie "Général" (ID 1)
    if (categoryId === 1) {
        return res.status(400).json({ error: 'La catégorie "Général" ne peut pas être supprimée' });
    }
    
    const categories = await loadCategories();
    const buttons = await loadButtons();
    
    // Vérifier qu'aucun bouton n'utilise cette catégorie
    const buttonsUsingCategory = buttons.filter(b => b.categoryId === categoryId);
    if (buttonsUsingCategory.length > 0) {
        return res.status(400).json({ 
            error: `Impossible de supprimer la catégorie: ${buttonsUsingCategory.length} bouton(s) l'utilisent encore` 
        });
    }
    
    const filteredCategories = categories.filter(c => c.id !== categoryId);
    
    if (filteredCategories.length === categories.length) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    if (await saveCategories(filteredCategories)) {
        res.json({ message: 'Catégorie supprimée avec succès' });
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

app.get('/api/obs-status', async (req, res) => {
    try {
        const status = { connected: obs.identified };

        if (obs.identified) {
            // Récupérer la scène actuelle si OBS est connecté
            try {
                const sceneResponse = await obs.call('GetCurrentProgramScene');
                status.currentScene = sceneResponse.sceneName;
            } catch (error) {
                console.error('Erreur lors de la récupération de la scène actuelle:', error);
            }
        }

        res.json(status);
    } catch (error) {
        console.error('Erreur lors de la vérification du statut OBS:', error);
        res.json({ connected: false });
    }
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

// Endpoint pour Server-Sent Events
app.get('/api/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Ajouter le client à la liste
    const clientId = Date.now();
    const client = {
        id: clientId,
        response: res
    };
    sseClients.push(client);

    // Envoyer un message de confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Nettoyer quand le client se déconnecte
    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
        console.log(`Client SSE ${clientId} déconnecté`);
    });
});

// Fonction pour envoyer des événements à tous les clients SSE
function broadcastToSSEClients(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    sseClients = sseClients.filter(client => {
        try {
            client.response.write(message);
            return true;
        } catch (err) {
            console.log('Client SSE déconnecté (erreur écriture)');
            return false;
        }
    });
}

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

let reconnectInterval;
const RECONNECT_DELAY = 5000; // 5 secondes

function startReconnectionAttempts() {
    if (reconnectInterval) return; // Éviter les multiples tentatives
    
    console.log('Démarrage des tentatives de reconnexion...');
    reconnectInterval = setInterval(async () => {
        if (!obs.identified) {
            console.log('Tentative de reconnexion à OBS...');
            try {
                await connectToOBS();
                if (obs.identified) {
                    console.log('✅ Reconnexion à OBS réussie !');
                    stopReconnectionAttempts();
                }
            } catch (error) {
                console.log('❌ Tentative de reconnexion échouée, nouvelle tentative dans 5s...');
            }
        } else {
            stopReconnectionAttempts();
        }
    }, RECONNECT_DELAY);
}

function stopReconnectionAttempts() {
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
        console.log('Arrêt des tentatives de reconnexion');
    }
}

obs.on('ConnectionClosed', () => {
    console.log('Connexion OBS fermée - Démarrage de la reconnexion automatique');
    startReconnectionAttempts();
});

obs.on('ConnectionError', (err) => {
    console.error('Erreur de connexion OBS:', err);
    if (!obs.identified) {
        startReconnectionAttempts();
    }
});

obs.on('Identified', () => {
    console.log('✅ OBS connecté et identifié');
    stopReconnectionAttempts();
});

// Écouter les changements de scène pour les broadcaster via SSE
obs.on('CurrentProgramSceneChanged', (data) => {
    console.log(`Scène changée vers: ${data.sceneName}`);
    broadcastToSSEClients({
        type: 'sceneChanged',
        sceneName: data.sceneName
    });
});

startServer().catch(console.error);