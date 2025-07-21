// assets/controllers/notification_controller.js

import { Controller } from '@hotwired/stimulus';
import * as Turbo from '@hotwired/turbo'; 

export default class extends Controller {
    static targets = [
        // Éléments du header/navbar (globaux)
        'notificationBell', // L'élément déclencheur du dropdown (souvent un <a> ou <button>)
        'countBadge',       // Le badge sur la cloche desktop
        'countBadgeMobile', // Le badge sur le lien mobile (offcanvas)
        'notificationList', // Le <ul> du dropdown desktop
        'mobileNotificationLink', // Le lien de la notification mobile dans l'offcanvas
        'offcanvasAccountElement', // La div de l'offcanvas du compte (pour cacher)

        // Éléments de l'onglet Notifications (dans la page Mon Compte)
        'notificationsTabContentList', // Le conteneur du contenu de l'onglet
        'notificationsTabButton',      // Le bouton de l'onglet (pour activer/écouter)
        'markAllReadTabButton',        // Le bouton "Marquer tout comme lu" dans l'onglet

        // Éléments de la page dédiée "Toutes les Notifications"
        'allNotificationsListPage', // Le conteneur de la liste de toutes les notifications
        'markAllReadPageButton'     // Le bouton "Marquer tout comme lu" sur la page dédiée
    ];

    // Instances Bootstrap JS
    offcanvasAccountInstance = null;

    connect() {
        console.log('Stimulus: notification_controller connecté.');
        
        // Initialiser l'instance de l'Offcanvas du compte si présente
        if (this.hasOffcanvasAccountElementTarget) {
            this.offcanvasAccountInstance = Offcanvas.getInstance(this.offcanvasAccountElementTarget) || new Offcanvas(this.offcanvasAccountElementTarget);
        }

        // Initialisation des messages de chargement pour les conteneurs s'ils existent
        if (this.hasNotificationListTarget) {
            this.notificationListTarget.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p></li>';
            this.notificationListTarget.classList.add('notification-dropdown-wide');
        }
        if (this.hasAllNotificationsListPageTarget) {
            this.allNotificationsListPageTarget.innerHTML = '<p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p>';
        }
        if (this.hasNotificationsTabContentListTarget) {
            this.notificationsTabContentListTarget.innerHTML = '<p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p>';
        }

        // Gérer les écouteurs d'événements spécifiques de Bootstrap qui ne sont pas des data-action simples
        if (this.hasNotificationBellTarget) {
            // Écouteur pour marquer les notifications comme lues lorsque le dropdown est montré
            this.notificationBellTarget.addEventListener('shown.bs.dropdown', this.handleDropdownShown.bind(this));
        }

        // Écouteur pour l'événement 'shown.bs.tab' sur le document pour l'onglet Notifications (si présent)
        // Ceci gère les clics sur les onglets depuis n'importe quel endroit de la page.
        document.addEventListener('shown.bs.tab', this.handleTabShown.bind(this));

        // Déclencher le fetch des notifications basé sur la page actuelle
        this.initialFetchLogic();
    }

    disconnect() {
        console.log('Stimulus: notification_controller déconnecté.');
        // Nettoyage des écouteurs ajoutés manuellement
        if (this.hasNotificationBellTarget) {
            this.notificationBellTarget.removeEventListener('shown.bs.dropdown', this.handleDropdownShown.bind(this));
        }
        document.removeEventListener('shown.bs.tab', this.handleTabShown.bind(this));
    }

    // Détermine quels éléments d'affichage de notification sont présents sur la page actuelle
    get isDesktopNotificationUIActive() {
        return this.hasNotificationBellTarget && this.hasNotificationListTarget;
    }
    get isAccountNotificationsTabPresent() {
        return this.hasNotificationsTabContentListTarget && this.hasNotificationsTabButtonTarget;
    }
    get isDedicatedNotificationsPagePresent() {
        return this.hasAllNotificationsListPageTarget;
    }

    async fetchNotifications() {
        if (!this.isDesktopNotificationUIActive && !this.isAccountNotificationsTabPresent && !this.isDedicatedNotificationsPagePresent) {
            return;
        }

        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors de la récupération des notifications: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();
            if (data && Array.isArray(data.notifications)) {
                this.updateNotificationUI(data.notifications, data.unreadCount);
            } else {
                console.error("La structure des données de notifications est inattendue.", data);
                if (this.hasNotificationListTarget) this.notificationListTarget.innerHTML = '<li><div class="small p-2 text-danger">Erreur: Données inattendues.</div></li>';
                if (this.hasNotificationsTabContentListTarget) this.notificationsTabContentListTarget.innerHTML = '<p class="text-danger p-2 mb-0">Erreur: Données inattendues.</p>';
                if (this.hasAllNotificationsListPageTarget) this.allNotificationsListPageTarget.innerHTML = '<p class="text-danger p-2 mb-0">Erreur: Données inattendues.</p>';
            }

        } catch (error) {
            console.error("Erreur dans fetchNotifications:", error);
            if (this.hasNotificationListTarget) this.notificationListTarget.innerHTML = '<li><div class="small p-2 text-danger">Erreur de chargement des notifications.</div></li>';
            if (this.hasNotificationsTabContentListTarget) this.notificationsTabContentListTarget.innerHTML = '<p class="text-danger p-2 mb-0">Erreur de chargement des notifications.</p>';
            if (this.hasAllNotificationsListPageTarget) this.allNotificationsListPageTarget.innerHTML = '<p class="text-danger p-2 mb-0">Erreur de chargement des notifications.</p>';
        } finally {
            this.ensureLoadingMessagesAreReplaced();
        }
    }

    // Remplace les messages de chargement initiaux si aucune erreur n'est affichée
    ensureLoadingMessagesAreReplaced() {
        const replaceIfLoadingAndNoError = (target, noNotifMessage) => {
            if (target && target.innerHTML.includes("Chargement...")) {
                if (!target.innerHTML.includes("Erreur:")) {
                    target.innerHTML = noNotifMessage;
                }
            }
        };

        if (this.hasNotificationListTarget) {
            replaceIfLoadingAndNoError(this.notificationListTarget, '<li><p class="text-center text-muted p-2 mb-0">Aucune notification.</p></li>');
        }
        if (this.hasAllNotificationsListPageTarget) {
            replaceIfLoadingAndNoError(this.allNotificationsListPageTarget, '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>');
        }
        if (this.hasNotificationsTabContentListTarget) {
            replaceIfLoadingAndNoError(this.notificationsTabContentListTarget, '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>');
        }
    }

    updateNotificationUI(notifications, unreadCount) {
        const badges = [];
        if (this.hasCountBadgeTarget) badges.push(this.countBadgeTarget);
        if (this.hasCountBadgeMobileTarget) badges.push(this.countBadgeMobileTarget);
        
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        });

        // Mise à jour du dropdown desktop
        if (this.hasNotificationListTarget) {
            this.notificationListTarget.innerHTML = ''; 
            if (notifications.length === 0) {
                this.notificationListTarget.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Aucune notification.</p></li>';
            } else {
                notifications.slice(0, 5).forEach(notif => {
                    const li = document.createElement('li');
                    const divContent = document.createElement('div');
                    divContent.className = `small p-2 ${!notif.estLue ? 'fw-bold bg-light rounded' : ''}`;
                    divContent.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <p class="mb-1">${notif.message}</p>
                        </div>
                        <small class="text-muted">${new Date(notif.creeLe).toLocaleString('fr-FR')}</small>
                    `;
                    li.appendChild(divContent);
                    this.notificationListTarget.appendChild(li);
                });
                if (notifications.length > 5) {
                    const liViewAll = document.createElement('li');
                    liViewAll.innerHTML = '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-center text-primary small" href="/mon-compte/notifications">Voir toutes les notifications</a></li>';
                    this.notificationListTarget.appendChild(liViewAll);
                }
            }
        }

        // Mise à jour du contenu du nouvel onglet Notifications
        if (this.hasNotificationsTabContentListTarget) {
            this.notificationsTabContentListTarget.innerHTML = '';
            if (notifications.length === 0) {
                this.notificationsTabContentListTarget.innerHTML = '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>';
                if (this.hasMarkAllReadTabButtonTarget) this.markAllReadTabButtonTarget.classList.add('d-none');
            } else {
                notifications.forEach(notif => {
                    const notificationItem = document.createElement('div');
                    notificationItem.className = `list-group-item list-group-item-action ${!notif.estLue ? 'bg-light' : ''}`;
                    notificationItem.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${notif.message}</h6>
                            <small class="text-muted">${new Date(notif.creeLe).toLocaleString('fr-FR')}</small>
                        </div>
                        <small>${notif.covoiturageAssocie ? `Covoiturage n°${notif.covoiturageAssocie.id}` : ''}</small>
                    `;
                    this.notificationsTabContentListTarget.appendChild(notificationItem);
                });
                if (this.hasMarkAllReadTabButtonTarget) {
                    if (unreadCount > 0) {
                        this.markAllReadTabButtonTarget.classList.remove('d-none');
                    } else {
                        this.markAllReadTabButtonTarget.classList.add('d-none');
                    }
                }
            }
        }

        // Mise à jour du contenu de la page dédiée "Toutes les Notifications"
        if (this.hasAllNotificationsListPageTarget) {
            this.allNotificationsListPageTarget.innerHTML = '';
            if (notifications.length === 0) {
                this.allNotificationsListPageTarget.innerHTML = '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>';
                if (this.hasMarkAllReadPageButtonTarget) this.markAllReadPageButtonTarget.classList.add('d-none');
            } else {
                notifications.forEach(notif => {
                    const notificationItem = document.createElement('div');
                    notificationItem.className = `list-group-item list-group-item-action ${!notif.estLue ? 'bg-light' : ''}`;
                    notificationItem.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${notif.message}</h6>
                            <small class="text-muted">${new Date(notif.creeLe).toLocaleString('fr-FR')}</small>
                        </div>
                        <small>${notif.covoiturageAssocie ? `Covoiturage n°${notif.covoiturageAssocie.id}` : ''}</small>
                    `;
                    this.allNotificationsListPageTarget.appendChild(notificationItem);
                });
                if (this.hasMarkAllReadPageButtonTarget) {
                    if (unreadCount > 0) {
                        this.markAllReadPageButtonTarget.classList.remove('d-none');
                    } else {
                        this.markAllReadPageButtonTarget.classList.add('d-none');
                    }
                }
            }
        }
    }

    // Logique de chargement initial (déplacée dans une méthode pour la clarté)
    initialFetchLogic() {
        if (this.isDedicatedNotificationsPagePresent) {
            this.fetchNotifications();
        } else if (window.location.pathname.includes('/mon-compte') && this.isAccountNotificationsTabPresent) {
            // Le fetchNotifications sera déclenché par le listener 'shown.bs.tab' quand l'onglet est activé
            // Mais on peut faire un fetch initial pour le badge mobile si la tab est présente mais non active
            if (this.hasCountBadgeMobileTarget) {
                this.fetchNotifications(); 
            }
        } else if (this.isDesktopNotificationUIActive) {
            this.fetchNotifications();
        }
    }

    // Actions liées aux boutons/liens
    // Gère le clic sur la cloche de notification desktop (data-action="click->notification#handleBellClick")
    handleBellClick(e) {
        const currentPath = window.location.pathname;
        const isOnMonComptePage = currentPath.startsWith('/mon-compte'); 

        if (isOnMonComptePage) {
            e.preventDefault(); 
            Turbo.visit('/mon-compte/notifications'); 
        } else {
            // Laisser Bootstrap gérer l'ouverture du dropdown
            // Le marquage comme lu se fera via l'événement 'shown.bs.dropdown'
        }
    }

    // Gère l'événement 'shown.bs.dropdown' de la cloche (attaché manuellement dans connect)
    async handleDropdownShown() {
        if (this.hasCountBadgeTarget && !this.countBadgeTarget.classList.contains('d-none')) {
            try {
                const response = await fetch('/api/notifications/mark-as-read', { method: 'POST' });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Erreur lors du marquage des notifications comme lues:', response.status, errorText);
                    throw new Error(`Erreur lors du marquage: ${response.status}`);
                }
                if (this.hasCountBadgeTarget) this.countBadgeTarget.classList.add('d-none');
                if (this.hasCountBadgeMobileTarget) this.countBadgeMobileTarget.classList.add('d-none');
                this.fetchNotifications(); 
            } catch (error) {
                console.error("Erreur lors du marquage des notifications comme lues:", error);
            }
        }
    }

    // Gère le clic sur les boutons "Marquer tout comme lu" (data-action="click->notification#markAllAsRead")
    async markAllAsRead(e) {
        try {
            const response = await fetch('/api/notifications/mark-all-as-read', { method: 'POST' });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erreur lors du marquage de toutes les notifications comme lues:', response.status, errorText);
                throw new Error(`Erreur lors du marquage: ${response.status}`);
            }
            this.fetchNotifications();
        } catch (error) {
            console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
        }
    }

    // Gère le clic sur le lien de notification mobile (data-action="click->notification#handleMobileNotificationClick")
    handleMobileNotificationClick(e) { 
        e.preventDefault(); 

        if (this.offcanvasAccountInstance) {
            this.offcanvasAccountInstance.hide();
        }

        Turbo.visit('/mon-compte/notifications');
    }

    // Gère l'événement 'shown.bs.tab' pour l'onglet Notifications (attaché manuellement dans connect)
    handleTabShown(e) {
        if (e.target.id === 'notifications-tab') {
            if (this.hasNotificationsTabContentListTarget) {
                this.fetchNotifications();
            }
        }
    }

    // Cette fonction (activateTabFromHash) peut être intégrée directement dans le connect
    // si elle est spécifique à cette page, ou appelée par un autre contrôleur si elle est globale.
    // Étant donné qu'elle est utilisée pour l'activation d'onglet par le hash,
    // elle devrait être appelée au chargement (dans connect) si l'onglet est pertinent.
    activateTabFromHash() {
        const hash = window.location.hash;
        if (window.location.pathname.includes('/mon-compte') && hash === '#notifications' && this.hasNotificationsTabButtonTarget) {
            const tab = new Tab(this.notificationsTabButtonTarget);
            tab.show();
        }
    }
}