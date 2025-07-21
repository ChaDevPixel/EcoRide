document.addEventListener('turbo:load', () => {
    const notificationBell = document.getElementById('notification-bell');
    const countBadge = document.getElementById('notification-count');
    const countBadgeMobile = document.getElementById('notification-count-mobile');
    const notificationList = document.getElementById('notification-list'); 
    const mobileNotificationLink = document.getElementById('mobile-notification-link');
    const offcanvasAccountElement = document.getElementById('offcanvasAccount');

    const notificationsTabContentList = document.getElementById('notifications-content-list');
    const notificationsTabButton = document.getElementById('notifications-tab'); 
    const markAllReadBtn = document.getElementById('mark-all-read-btn'); 

    const allNotificationsListPage = document.getElementById('all-notifications-list'); 
    const markAllReadPageBtn = document.getElementById('mark-all-read-page-btn');

    const isDesktopNotificationUIActive = notificationBell && notificationList;
    const isAccountNotificationsTabPresent = notificationsTabContentList && notificationsTabButton;
    const isDedicatedNotificationsPagePresent = allNotificationsListPage !== null;

    if (notificationList) {
        notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p></li>';
        notificationList.classList.add('notification-dropdown-wide');
    }
    if (allNotificationsListPage) {
        allNotificationsListPage.innerHTML = '<p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p>';
    }
    if (notificationsTabContentList) {
        notificationsTabContentList.innerHTML = '<p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p>';
    }


    const fetchNotifications = async () => {
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

        if (notificationList) {
            notificationList.innerHTML = ''; 
            if (notifications.length === 0) {
                notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Aucune notification.</p></li>';
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
                    notificationList.appendChild(li);
                });
                if (notifications.length > 5) {
                    const liViewAll = document.createElement('li');
                    liViewAll.innerHTML = '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-center text-primary small" href="/mon-compte/notifications">Voir toutes les notifications</a></li>';
                    notificationList.appendChild(liViewAll);
                }
            }
        }

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

    if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
            const currentPath = window.location.pathname;
            console.log('Cloche desktop cliquée. Chemin actuel:', currentPath);
            const isOnMonComptePage = currentPath.startsWith('/mon-compte'); 

            if (isOnMonComptePage) {
                console.log('Sur la page Mon Compte. Redirection vers /mon-compte/notifications.');
                e.preventDefault(); 
                window.location.href = '/mon-compte/notifications'; 
            } else {
                console.log('Pas sur la page Mon Compte. Laisser le dropdown s\'ouvrir.');
           
            }
        });

        notificationBell.addEventListener('shown.bs.dropdown', async () => {
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

    if (mobileNotificationLink && offcanvasAccountElement) { 
        mobileNotificationLink.addEventListener('click', (e) => {
            e.preventDefault(); 

            const offcanvasAccount = bootstrap.Offcanvas.getInstance(offcanvasAccountElement);
            if (offcanvasAccount) {
                offcanvasAccount.hide();
            }

            window.location.href = '/mon-compte/notifications';
        });
    }

    const activateTabFromHash = () => {
        const hash = window.location.hash;
        if (window.location.pathname.includes('/mon-compte') && hash === '#notifications' && notificationsTabButton) {
            const tab = new bootstrap.Tab(notificationsTabButton);
            tab.show();
        }
    };

    document.addEventListener('shown.bs.tab', (e) => {
        if (e.target.id === 'notifications-tab') {
            if (notificationsTabContentList) {
                fetchNotifications();
            }
        }
    });

    if (isDedicatedNotificationsPagePresent) {
        fetchNotifications();
    }

    else if (window.location.pathname.includes('/mon-compte')) {

        if (countBadgeMobile) { 
            fetchNotifications(); 
        }
    }
    
    else if (isDesktopNotificationUIActive) {
        fetchNotifications();
    }
});
