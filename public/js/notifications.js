document.addEventListener('DOMContentLoaded', () => {
    const notificationBell = document.getElementById('notification-bell');
    if (!notificationBell) {
        console.warn("L'élément #notification-bell n'a pas été trouvé. Le script de notifications ne s'exécutera pas.");
        return;
    }

    const countBadge = document.getElementById('notification-count');
    const countBadgeMobile = document.getElementById('notification-count-mobile');
    const notificationList = document.getElementById('notification-list');

    // Optionnel : Si votre HTML affiche un message "Chargement..." par défaut,
    // vous pouvez le définir ici avant le fetch pour s'assurer qu'il est visible.
    if (notificationList) {
        notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Chargement des notifications...</p></li>';
    }

    const fetchNotifications = async () => {
        try {
            console.log('Tentative de récupération des notifications depuis /api/notifications...');
            const response = await fetch('/api/notifications');
            console.log('Statut de la réponse API:', response.status, response.statusText);

            if (!response.ok) {
                // Si la réponse n'est pas OK (ex: 401, 403, 500), lisez le texte d'erreur du serveur
                const errorText = await response.text();
                console.error('Réponse d\'erreur du serveur:', errorText);
                throw new Error(`Erreur lors de la récupération des notifications: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Données de notifications reçues:', data);
            
            // Vérifiez que data.notifications est bien un tableau
            if (data && Array.isArray(data.notifications)) {
                updateNotificationUI(data.notifications, data.unreadCount);
            } else {
                console.error("La structure des données de notifications est inattendue.", data);
                if (notificationList) {
                    notificationList.innerHTML = '<li><a class="dropdown-item text-danger" href="#">Erreur: Données inattendues.</a></li>';
                }
            }

        } catch (error) {
            console.error("Erreur dans fetchNotifications:", error);
            if (notificationList) {
                notificationList.innerHTML = '<li><a class="dropdown-item text-danger" href="#">Erreur de chargement des notifications.</a></li>';
            }
        }
    };

    const updateNotificationUI = (notifications, unreadCount) => {
        console.log('Mise à jour de l\'interface utilisateur des notifications.');
        console.log('Notifications à afficher:', notifications);
        console.log('Nombre de notifications non lues:', unreadCount);

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
            notificationList.innerHTML = ''; // Efface le message de chargement ou les anciennes notifications
            if (notifications.length === 0) {
                notificationList.innerHTML = '<li><p class="text-center text-muted p-2 mb-0">Aucune notification.</p></li>';
            } else {
                notifications.forEach(notif => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = `dropdown-item small ${!notif.estLue ? 'fw-bold' : ''}`;
                    // Assurez-vous que covoiturageAssocie et son id existent avant de construire le lien
                    a.href = notif.covoiturageAssocie && notif.covoiturageAssocie.id ? `/covoiturage/${notif.covoiturageAssocie.id}` : '#';
                    a.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <p class="mb-1">${notif.message}</p>
                        </div>
                        <small class="text-muted">${new Date(notif.creeLe).toLocaleString('fr-FR')}</small>
                    `;
                    li.appendChild(a);
                    notificationList.appendChild(li);
                });
                // Suppression du lien "Voir toutes les notifications"
                // const hr = document.createElement('hr');
                // notificationList.appendChild(hr);
                // const liViewAll = document.createElement('li');
                // liViewAll.innerHTML = '<a class="dropdown-item text-center text-primary small" href="/mon-compte/notifications">Voir toutes les notifications</a>';
                // notificationList.appendChild(liViewAll);
            }
        }
    };

    notificationBell.addEventListener('click', async () => {
        // Seulement si le badge n'est pas déjà caché (c'est-à-dire s'il y a des notifications non lues)
        if (countBadge && !countBadge.classList.contains('d-none')) {
            try {
                console.log('Marquage des notifications comme lues...');
                const response = await fetch('/api/notifications/mark-as-read', { method: 'POST' });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Erreur lors du marquage des notifications comme lues:', response.status, errorText);
                    throw new Error(`Erreur lors du marquage: ${response.status}`);
                }
                console.log('Notifications marquées comme lues avec succès.');
                countBadge.classList.add('d-none');
                if (countBadgeMobile) countBadgeMobile.classList.add('d-none');
            } catch (error) {
                console.error("Erreur lors du marquage des notifications comme lues:", error);
            }
        }
    });

    // Lance la première récupération des notifications au chargement de la page
    fetchNotifications();
    // Optionnel : Récupère les notifications toutes les minutes
    // setInterval(fetchNotifications, 60000); 
});