class OBSController {
    constructor() {
        this.buttons = [];
        this.currentEditingButton = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadButtons();
        await this.loadSettings();
        await this.checkOBSStatus();
        
        setInterval(() => this.checkOBSStatus(), 5000);
    }

    bindEvents() {
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('button-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal')) {
                this.closeModal();
            }
        });
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            document.getElementById('app-title').textContent = settings.appTitle;
            document.title = settings.appTitle;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        }
    }

    async loadButtons() {
        try {
            const response = await fetch('/api/buttons');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.buttons = await response.json();
            this.renderButtons();
        } catch (error) {
            console.error('Erreur lors du chargement des boutons:', error);
            // Ne pas afficher l'erreur lors du premier chargement car le serveur peut ne pas être prêt
            if (this.buttons && this.buttons.length > 0) {
                this.showError('Erreur lors du chargement des boutons');
            }
        }
    }

    renderButtons() {
        const grid = document.getElementById('buttons-grid');
        grid.innerHTML = '';

        // Grouper les boutons par catégorie avec tri
        const categories = {};
        this.buttons.forEach(button => {
            const category = button.category || 'Général';
            if (!categories[category]) {
                categories[category] = {
                    buttons: [],
                    order: button.categoryOrder || 999 // Par défaut à la fin
                };
            }
            categories[category].buttons.push(button);
        });

        // Trier les catégories par ordre, puis par nom
        const sortedCategories = Object.keys(categories).sort((a, b) => {
            const orderA = categories[a].order;
            const orderB = categories[b].order;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.localeCompare(b);
        });

        // Créer une section pour chaque catégorie
        sortedCategories.forEach(categoryName => {
            // Trier les boutons dans chaque catégorie
            const sortedButtons = categories[categoryName].buttons.sort((a, b) => {
                const orderA = a.buttonOrder || 999;
                const orderB = b.buttonOrder || 999;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return a.name.localeCompare(b.name);
            });
            
            const categorySection = this.createCategorySection(categoryName, sortedButtons);
            grid.appendChild(categorySection);
        });
        
        this.updateButtonsList();
    }

    updateButtonsList() {
        const buttonsList = document.getElementById('existing-buttons-list');
        if (!buttonsList) return;
        
        buttonsList.innerHTML = '';

        this.buttons.forEach(button => {
            const buttonItem = document.createElement('div');
            buttonItem.className = 'dropdown-item button-item';
            buttonItem.innerHTML = `
                <div class="button-item-info">
                    <span class="button-item-name">${button.name}</span>
                    <span class="button-item-category">${button.category || 'Général'}</span>
                </div>
                <div class="button-item-actions">
                    <button class="button-action edit" data-button-id="${button.id}" title="Modifier">✎</button>
                    <button class="button-action delete" data-button-id="${button.id}" title="Supprimer">×</button>
                </div>
            `;
            buttonsList.appendChild(buttonItem);
        });
        
        // Ajouter les gestionnaires d'événements
        buttonsList.querySelectorAll('.button-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const buttonId = parseInt(btn.getAttribute('data-button-id'));
                this.editButton(buttonId);
                closeSettingsMenu();
            });
        });
        
        buttonsList.querySelectorAll('.button-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const buttonId = parseInt(btn.getAttribute('data-button-id'));
                this.deleteButton(buttonId);
                closeSettingsMenu();
            });
        });
    }

    createCategorySection(categoryName, buttons) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-section';
        
        const categoryHeader = document.createElement('h2');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = categoryName;
        categoryDiv.appendChild(categoryHeader);
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'category-buttons';
        
        buttons.forEach(button => {
            const buttonElement = this.createButtonElement(button);
            buttonsContainer.appendChild(buttonElement);
        });
        
        categoryDiv.appendChild(buttonsContainer);
        return categoryDiv;
    }

    createButtonElement(button) {
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'scene-button';
        buttonDiv.innerHTML = `
            <img src="${button.image}" alt="${button.name}" class="button-image" onerror="this.src='/images/default.svg'">
            <div class="button-overlay">
                <div class="button-name">${button.name}</div>
                <div class="button-scene">Scène: ${button.scene}</div>
            </div>
        `;

        // Optimisation tactile pour iOS
        let touchStartTime = 0;
        let touchMoved = false;
        
        buttonDiv.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchMoved = false;
            
            if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete')) {
                buttonDiv.style.transform = 'scale(0.95)';
                buttonDiv.style.transition = 'transform 0.1s ease';
            }
        }, { passive: true });
        
        buttonDiv.addEventListener('touchmove', () => {
            touchMoved = true;
            buttonDiv.style.transform = '';
        }, { passive: true });
        
        buttonDiv.addEventListener('touchend', (e) => {
            e.preventDefault(); // Empêche le délai de 300ms d'iOS
            
            buttonDiv.style.transform = '';
            
            const touchDuration = Date.now() - touchStartTime;
            
            if (!touchMoved && touchDuration < 500 && 
                !e.target.classList.contains('btn-edit') && 
                !e.target.classList.contains('btn-delete')) {
                
                this.changeScene(button.scene);
            }
        });
        
        // Fallback pour les navigateurs desktop
        buttonDiv.addEventListener('click', (e) => {
            if (!('ontouchstart' in window) && 
                !e.target.classList.contains('btn-edit') && 
                !e.target.classList.contains('btn-delete')) {
                this.changeScene(button.scene);
            }
        });

        return buttonDiv;
    }

    async changeScene(sceneName) {
        try {
            const response = await fetch('/api/change-scene', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sceneName })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.flashButton(sceneName);
            } else {
                this.showError(result.error || 'Erreur lors du changement de scène');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('Erreur de connexion au serveur');
        }
    }

    flashButton(sceneName) {
        // Désactive le flash sur les appareils tactiles pour éviter les conflits
        if ('ontouchstart' in window) {
            return;
        }
        
        const buttons = document.querySelectorAll('.scene-button');
        buttons.forEach(button => {
            const sceneText = button.querySelector('.button-scene').textContent;
            if (sceneText.includes(sceneName)) {
                button.style.animation = 'flash 0.5s ease-in-out';
                setTimeout(() => {
                    button.style.animation = '';
                }, 500);
            }
        });
    }

    async checkOBSStatus() {
        try {
            const response = await fetch('/api/obs-status');
            const status = await response.json();
            const statusElement = document.getElementById('obs-status');
            
            if (status.connected) {
                statusElement.textContent = 'OBS Connecté';
                statusElement.className = 'status-connected';
            } else {
                statusElement.textContent = 'OBS Déconnecté';
                statusElement.className = 'status-disconnected';
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut OBS:', error);
        }
    }

    openModal(button = null) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('button-form');
        
        this.currentEditingButton = button;
        
        if (button) {
            title.textContent = 'Modifier le bouton';
            document.getElementById('button-name').value = button.name;
            document.getElementById('button-category').value = button.category || 'Général';
            document.getElementById('category-order').value = button.categoryOrder || 1;
            document.getElementById('button-order').value = button.buttonOrder || 1;
            document.getElementById('scene-name').value = button.scene;
            document.getElementById('button-image').value = button.image;
        } else {
            title.textContent = 'Ajouter un bouton';
            form.reset();
            document.getElementById('button-category').value = 'Général';
            document.getElementById('category-order').value = 1;
            document.getElementById('button-order').value = 1;
        }
        
        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('show');
        this.currentEditingButton = null;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('button-name').value,
            category: document.getElementById('button-category').value || 'Général',
            categoryOrder: parseInt(document.getElementById('category-order').value) || 1,
            buttonOrder: parseInt(document.getElementById('button-order').value) || 1,
            scene: document.getElementById('scene-name').value,
            image: document.getElementById('button-image').value || '/images/default.svg'
        };

        try {
            let response;
            
            if (this.currentEditingButton) {
                response = await fetch(`/api/buttons/${this.currentEditingButton.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch('/api/buttons', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                await this.loadButtons();
                this.closeModal();
                this.showSuccess(this.currentEditingButton ? 'Bouton modifié avec succès' : 'Bouton ajouté avec succès');
            } else {
                const error = await response.json();
                this.showError(error.error || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('Erreur de connexion au serveur');
        }
    }

    async editButton(buttonId) {
        const button = this.buttons.find(b => b.id === buttonId);
        if (button) {
            this.openModal(button);
        }
    }

    async deleteButton(buttonId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce bouton ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/buttons/${buttonId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadButtons();
                this.showSuccess('Bouton supprimé avec succès');
            } else {
                const error = await response.json();
                this.showError(error.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('Erreur de connexion au serveur');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? 'linear-gradient(45deg, #4CAF50, #45a049)' : 'linear-gradient(45deg, #f44336, #d32f2f)'};
            box-shadow: 0 8px 25px ${type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
            backdrop-filter: blur(10px);
            border: 1px solid ${type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(33, 150, 243, 0.6); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

let obsController;

// Initialiser après que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    obsController = new OBSController();
});

// Fonctions globales pour le menu settings
function toggleSettingsMenu() {
    const dropdown = document.getElementById('settings-dropdown');
    const overlay = document.getElementById('menu-overlay');
    
    if (dropdown.classList.contains('show')) {
        closeSettingsMenu();
    } else {
        dropdown.classList.add('show');
        overlay.classList.add('show');
    }
}

function closeSettingsMenu() {
    const dropdown = document.getElementById('settings-dropdown');
    const overlay = document.getElementById('menu-overlay');
    
    dropdown.classList.remove('show');
    overlay.classList.remove('show');
}

function openAddButtonModal() {
    if (obsController) {
        obsController.openModal();
        closeSettingsMenu();
    }
}

function openEditTitleModal() {
    const currentTitle = document.getElementById('app-title').textContent;
    document.getElementById('app-title-input').value = currentTitle;
    document.getElementById('title-modal').classList.add('show');
    closeSettingsMenu();
}

async function openOBSSettingsModal() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        document.getElementById('obs-password-input').value = settings.obsPassword || '';
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres OBS:', error);
    }
    document.getElementById('obs-settings-modal').classList.add('show');
    closeSettingsMenu();
}

function closeOBSSettingsModal() {
    document.getElementById('obs-settings-modal').classList.remove('show');
}

// Fonctions globales pour la gestion du titre
function editTitle() {
    const currentTitle = document.getElementById('app-title').textContent;
    document.getElementById('app-title-input').value = currentTitle;
    document.getElementById('title-modal').classList.add('show');
}

function closeTitleModal() {
    document.getElementById('title-modal').classList.remove('show');
}

// Gestion du formulaire de titre
document.getElementById('title-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newTitle = document.getElementById('app-title-input').value.trim();
    
    if (!newTitle) {
        obsController.showError('Le titre ne peut pas être vide');
        return;
    }
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appTitle: newTitle })
        });
        
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('app-title').textContent = settings.appTitle;
            document.title = settings.appTitle;
            closeTitleModal();
            obsController.showSuccess('Titre modifié avec succès');
        } else {
            const error = await response.json();
            obsController.showError(error.error || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        obsController.showError('Erreur de connexion au serveur');
    }
});

// Gestion du formulaire de configuration OBS
document.getElementById('obs-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const obsPassword = document.getElementById('obs-password-input').value.trim();
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ obsPassword })
        });
        
        if (response.ok) {
            closeOBSSettingsModal();
            obsController.showSuccess('Configuration OBS mise à jour. Reconnexion en cours...');
            
            // Forcer une reconnexion immédiate
            try {
                const reconnectResponse = await fetch('/api/obs-reconnect', {
                    method: 'POST'
                });
                
                if (reconnectResponse.ok) {
                    // Vérifier le statut après reconnexion
                    setTimeout(() => {
                        obsController.checkOBSStatus();
                    }, 2000);
                }
            } catch (error) {
                console.error('Erreur lors de la reconnexion:', error);
            }
        } else {
            const error = await response.json();
            obsController.showError(error.error || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        obsController.showError('Erreur de connexion au serveur');
    }
});

// Fermer les modals en cliquant à côté
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('title-modal')) {
        closeTitleModal();
    }
    if (e.target === document.getElementById('obs-settings-modal')) {
        closeOBSSettingsModal();
    }
});

// Fermer le menu settings en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    const settingsMenu = document.querySelector('.settings-menu');
    const dropdown = document.getElementById('settings-dropdown');
    
    if (!settingsMenu.contains(e.target) && dropdown.classList.contains('show')) {
        closeSettingsMenu();
    }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('PWA: Service Worker registered', registration);
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateAvailable();
                    }
                });
            });
        } catch (error) {
            console.error('PWA: Service Worker registration failed', error);
        }
    });
}

// PWA Install Prompt - Désactivé
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: Install prompt available (but hidden)');
    e.preventDefault();
});

window.addEventListener('appinstalled', () => {
    console.log('PWA: App installed successfully');
});

function showUpdateAvailable() {
    const updateDiv = document.createElement('div');
    updateDiv.className = 'update-banner';
    updateDiv.innerHTML = `
        <span>Une nouvelle version est disponible!</span>
        <button onclick="refreshApp()" class="btn-primary">Mettre à jour</button>
    `;
    updateDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10001;
        animation: slideDown 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    `;
    document.body.appendChild(updateDiv);
}

function refreshApp() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }
}

// Fonction pour rafraîchir la page
function refreshPage() {
    if (obsController) {
        const refreshButton = document.getElementById('refresh-btn');
        
        // Animation de rotation du bouton
        refreshButton.style.transform = 'rotate(360deg)';
        refreshButton.style.transition = 'transform 0.5s ease';
        
        // Recharger toutes les données
        Promise.all([
            obsController.loadButtons(),
            obsController.loadSettings(),
            obsController.checkOBSStatus()
        ]).finally(() => {
            // Remettre le bouton à sa position initiale après l'animation
            setTimeout(() => {
                refreshButton.style.transform = '';
                refreshButton.style.transition = '';
            }, 500);
        });
        
    }
}

// iOS Standalone mode adjustments
if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    console.log('PWA: Running in standalone mode');
    document.body.classList.add('standalone');
    
    // Prevent zoom on iOS
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
}