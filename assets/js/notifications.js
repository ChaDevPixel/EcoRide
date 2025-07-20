document.addEventListener('turbo:load', () => {
    const notificationBell = document.getElementById('notification-bell');
    const countBadge = document.getElementById('notification-count');
    const countBadgeMobile = document.getElementById('notification-count-mobile');
    const notificationList = document.getElementById('notification-list'); // Pour le dropdown desktop
    const mobileNotificationLink = document.getElementById('mobile-notification-link');
    const offcanvasAccountElement = document.getElementById('offcanvasAccount');

    // Éléments pour le nouvel onglet Notifications (dans la page Mon Compte)
    // Ces éléments seront null si l'onglet n'est pas présent dans le DOM de la page Mon Compte.
    const notificationsTabContentList = document.getElementById('notifications-content-list');
    const notificationsTabButton = document.getElementById('notifications-tab'); // Le bouton de l'onglet
    const markAllReadBtn = document.getElementById('mark-all-read-btn'); // Bouton dans l'onglet

    // Éléments pour la page dédiée "Toutes les Notifications" (notification.html.twig)
    const allNotificationsListPage = document.getElementById('all-notifications-list'); // Conteneur sur la page dédiée
    const markAllReadPageBtn = document.getElementById('mark-all-read-page-btn'); // Bouton sur la page dédiée

    // Déterminer quels éléments d'affichage de notification sont présents sur la page actuelle
    const isDesktopNotificationUIActive = notificationBell && notificationList;
    // isAccountNotificationsTabPresent sera false si l'onglet n'est pas dans le HTML de compte.html.twig
    const isAccountNotificationsTabPresent = notificationsTabContentList && notificationsTabButton;
    const isDedicatedNotificationsPagePresent = allNotificationsListPage !== null;

    // Initialisation des messages de chargement pour les conteneurs s'ils existent
    if (notificationList) {
        notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p></li>';
        notificationList.classList.add('notification-dropdown-wide');
    }
    if (allNotificationsListPage) {
        allNotificationsListPage.innerHTML = '<p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p>';
    }
    // Ce bloc ne s'exécutera que si notificationsTabContentList est trouvé (donc si l'onglet est présent)
    if (notificationsTabContentList) {
        notificationsTabContentList.innerHTML = '<p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p>';
    }


    const fetchNotifications = async () => {
        // Seule la présence d'un élément d'affichage principal déclenche le fetch API
        if (!isDesktopNotificationUIActive && !isAccountNotificationsTabPresent && !isDedicatedNotificationsPagePresent) {
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
                updateNotificationUI(data.notifications, data.unreadCount);
            } else {
                console.error("La structure des données de notifications est inattendue.", data);
                if (notificationList) {
                    notificationList.innerHTML = '<li><div class="small p-2 text-danger">Erreur: Données inattendues.</div></li>';
                }
                if (notificationsTabContentList) {
                    notificationsTabContentList.innerHTML = '<p class="text-danger p-2 mb-0">Erreur: Données inattendues.</p>';
                }
                if (allNotificationsListPage) {
                    allNotificationsListPage.innerHTML = '<p class="text-danger p-2 mb-0">Erreur: Données inattendues.</p>';
                }
            }

        } catch (error) {
            console.error("Erreur dans fetchNotifications:", error);
            if (notificationList) {
                notificationList.innerHTML = '<li><div class="small p-2 text-danger">Erreur de chargement des notifications.</div></li>';
            }
            if (notificationsTabContentList) {
                notificationsTabContentList.innerHTML = '<p class="text-danger p-2 mb-0">Erreur de chargement des notifications.</p>';
            }
            if (allNotificationsListPage) {
                allNotificationsListPage.innerHTML = '<p class="text-danger p-2 mb-0">Erreur de chargement des notifications.</p>';
            }
        } finally {
            // S'assurer que les messages de chargement sont remplacés même en cas de problème ou d'absence de données
            if (notificationList && notificationList.innerHTML.includes("Chargement...")) {
                if (!notificationList.innerHTML.includes("Erreur:")) {
                    notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Aucune notification.</p></li>';
                }
            }
            if (allNotificationsListPage && allNotificationsListPage.innerHTML.includes("Chargement...")) {
                if (!allNotificationsListPage.innerHTML.includes("Erreur:")) {
                   allNotificationsListPage.innerHTML = '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>';
                }
           }
            // Ce bloc ne s'exécutera que si notificationsTabContentList est trouvé
            if (notificationsTabContentList && notificationsTabContentList.innerHTML.includes("Chargement...")) {
                 if (!notificationsTabContentList.innerHTML.includes("Erreur:")) {
                    notificationsTabContentList.innerHTML = '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>';
                 }
            }
        }
    };

    const updateNotificationUI = (notifications, unreadCount) => {
        const badges = [countBadge, countBadgeMobile];
        badges.forEach(badge => {
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.classList.remove('d-none');
                } else {
                    badge.classList.add('d-none');
                }
            }
        });

        // Mise à jour du dropdown desktop
        if (notificationList) {
            notificationList.innerHTML = ''; 
            if (notifications.length === 0) {
                notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Aucune notification.</p></li>';
            } else {
                notifications.slice(0, 5).forEach(notif => { // Afficher seulement les 5 dernières dans le dropdown
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
                    notificationList.appendChild(li);
                });
                if (notifications.length > 5) {
                    const liViewAll = document.createElement('li');
                    liViewAll.innerHTML = '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-center text-primary small" href="/mon-compte/notifications">Voir toutes les notifications</a></li>';
                    notificationList.appendChild(liViewAll);
                }
            }
        }

        // Mise à jour du contenu du nouvel onglet Notifications
        if (notificationsTabContentList) {
            notificationsTabContentList.innerHTML = '';
            if (notifications.length === 0) {
                notificationsTabContentList.innerHTML = '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>';
                if (markAllReadBtn) markAllReadBtn.classList.add('d-none');
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
                    notificationsTabContentList.appendChild(notificationItem);
                });
                if (markAllReadBtn) {
                    if (unreadCount > 0) {
                        markAllReadBtn.classList.remove('d-none');
                    } else {
                        markAllReadBtn.classList.add('d-none');
                    }
                }
            }
        }

        // Mise à jour du contenu de la page dédiée "Toutes les Notifications"
        if (allNotificationsListPage) {
            allNotificationsListPage.innerHTML = '';
            if (notifications.length === 0) {
                allNotificationsListPage.innerHTML = '<p class="text-center text-muted p-2 mb-0">Aucune notification à afficher.</p>';
                if (markAllReadPageBtn) markAllReadPageBtn.classList.add('d-none');
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
                    allNotificationsListPage.appendChild(notificationItem);
                });
                if (markAllReadPageBtn) {
                    if (unreadCount > 0) {
                        markAllReadPageBtn.classList.remove('d-none');
                    } else {
                        markAllReadPageBtn.classList.add('d-none');
                    }
                }
            }
        }
    };

    // MODIFICATION: Gère le clic sur la cloche de notification desktop
    if (notificationBell) {
        // Écouteur pour la redirection conditionnelle
        notificationBell.addEventListener('click', (e) => {
            const currentPath = window.location.pathname;
            console.log('Cloche desktop cliquée. Chemin actuel:', currentPath);
            // Vérifier si le chemin commence par '/mon-compte' (pour inclure /mon-compte/ et /mon-compte/profil etc.)
            const isOnMonComptePage = currentPath.startsWith('/mon-compte'); 

            if (isOnMonComptePage) {
                console.log('Sur la page Mon Compte. Redirection vers /mon-compte/notifications.');
                e.preventDefault(); // Empêche le comportement par défaut (ouverture du dropdown)
                window.location.href = '/mon-compte/notifications'; // Redirige vers la page des notifications
            } else {
                console.log('Pas sur la page Mon Compte. Laisser le dropdown s\'ouvrir.');
                // Laisser Bootstrap gérer l'ouverture du dropdown.
                // Le marquage comme lu se fera via l'événement 'shown.bs.dropdown'.
            }
        });

        // Écouteur pour marquer les notifications comme lues lorsque le dropdown est montré
        // Ceci est séparé de l'écouteur de clic pour ne pas interférer avec la redirection.
        notificationBell.addEventListener('shown.bs.dropdown', async () => {
            // Cette logique ne s'exécute que si le dropdown s'ouvre (donc pas sur /mon-compte)
            if (countBadge && !countBadge.classList.contains('d-none')) {
                try {
                    const response = await fetch('/api/notifications/mark-as-read', { method: 'POST' });
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Erreur lors du marquage des notifications comme lues:', response.status, errorText);
                        throw new Error(`Erreur lors du marquage: ${response.status}`);
                    }
                    if (countBadge) countBadge.classList.add('d-none');
                    if (countBadgeMobile) countBadgeMobile.classList.add('d-none');
                    fetchNotifications(); 
                } catch (error) {
                    console.error("Erreur lors du marquage des notifications comme lues:", error);
                }
            }
        });
    }

    // Gère le clic sur le bouton "Marquer tout comme lu" dans l'onglet (si l'onglet existe)
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/notifications/mark-all-as-read', { method: 'POST' });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Erreur lors du marquage de toutes les notifications comme lues:', response.status, errorText);
                    throw new Error(`Erreur lors du marquage: ${response.status}`);
                }
                fetchNotifications();
            } catch (error) {
                console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
            }
        });
    }

    // Gère le clic sur le bouton "Marquer tout comme lu" sur la page dédiée
    if (markAllReadPageBtn) {
        markAllReadPageBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/notifications/mark-all-as-read', { method: 'POST' });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Erreur lors du marquage de toutes les notifications comme lues:', response.status, errorText);
                    throw new Error(`Erreur lors du marquage: ${response.status}`);
                }
                fetchNotifications();
            } catch (error) {
                console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
            }
        });
    }

    // Gère le clic sur le lien de notification mobile (redirige toujours vers la page dédiée)
    if (mobileNotificationLink && offcanvasAccountElement) { 
        mobileNotificationLink.addEventListener('click', (e) => {
            e.preventDefault(); 

            const offcanvasAccount = bootstrap.Offcanvas.getInstance(offcanvasAccountElement);
            if (offcanvasAccount) {
                offcanvasAccount.hide();
            }

            window.location.href = '/mon-compte/notifications'; // Redirige vers la page dédiée
        });
    }

    // Gérer l'activation de l'onglet par l'URL hash (pour les rechargements directs sur la page Mon Compte)
    // Cette fonction n'est plus pertinente si l'onglet n'existe pas sur la page Mon Compte,
    // mais elle est maintenue pour éviter les erreurs si appelée dans d'autres contextes.
    const activateTabFromHash = () => {
        const hash = window.location.hash;
        // La condition `notificationsTabButton` sera false si l'onglet n'est pas dans le HTML de `compte.html.twig`
        if (window.location.pathname.includes('/mon-compte') && hash === '#notifications' && notificationsTabButton) {
            const tab = new bootstrap.Tab(notificationsTabButton);
            tab.show();
            // fetchNotifications will be called by the 'shown.bs.tab' listener
        }
    };

    // Écouteur délégué pour l'événement 'shown.bs.tab' sur la page 'Mon Compte'
    // Ce listener ne s'exécutera que si l'onglet Notifications est réellement présent dans le DOM.
    document.addEventListener('shown.bs.tab', (e) => {
        if (e.target.id === 'notifications-tab') {
            if (notificationsTabContentList) {
                fetchNotifications();
            }
        }
    });

    // --- Logique de chargement initial ---
    // Cette logique s'exécute une seule fois au chargement initial de la page (ou après une navigation Turbo).
    // Elle détermine quelles notifications doivent être chargées immédiatement.

    // Si nous sommes sur la page dédiée aux notifications (notification.html.twig), on la charge.
    if (isDedicatedNotificationsPagePresent) {
        fetchNotifications();
    }
    // Si nous sommes sur la page 'Mon Compte' (où il n'y a PAS d'onglet Notifications intégré),
    // nous ne faisons rien ici pour l'onglet. Le comportement de la cloche desktop et du lien mobile redirige.
    else if (window.location.pathname.includes('/mon-compte')) {
        // Pas de fetchNotifications ici, car la cloche desktop redirige et le lien mobile redirige.
        // Aucune notification n'est affichée directement sur la page /mon-compte elle-même.
        // Cependant, on doit s'assurer que le badge mobile est mis à jour.
        if (countBadgeMobile) { // S'assurer que le badge mobile est présent
            fetchNotifications(); // Appeler fetch pour mettre à jour le badge mobile
        }
    }
    // Si la cloche desktop est active (présente sur la page et ce n'est PAS /mon-compte), on la charge.
    // Cette partie doit être en dernier pour ne pas interférer avec les pages spécifiques.
    else if (isDesktopNotificationUIActive) {
        fetchNotifications();
    }
});
