// public/js/admin_dashboard.js

// Encapsuler tout le code JavaScript dans une IIFE pour créer une portée locale
// et éviter les conflits de variables globales si le script est chargé plusieurs fois.
(function() {
    // Déclarer les variables d'instance de graphique dans cette portée locale
    let carpoolChartInstance = null;
    let earningsChartInstance = null;
    let chartData = null; // Variable pour stocker les données une fois qu'elles sont récupérées
    let adminApiChartDataUrl = null; // Déclarer ici, sera initialisée depuis le DOM

    document.addEventListener('DOMContentLoaded', function() {
        // Récupérer l'URL de l'API depuis l'attribut data-api-url de l'élément adminTabContent
        const adminTabContentElement = document.getElementById('adminTabContent');
        if (adminTabContentElement && adminTabContentElement.dataset.apiUrl) {
            adminApiChartDataUrl = adminTabContentElement.dataset.apiUrl;
        } else {
            console.error("Erreur: L'attribut 'data-api-url' n'est pas trouvé sur l'élément '#adminTabContent'. Les graphiques ne peuvent pas être chargés.");
            return; // Arrêter l'exécution si l'URL n'est pas trouvée
        }

        // Fonction pour récupérer les données (une seule fois)
        async function fetchChartData() {
            try {
                const response = await fetch(adminApiChartDataUrl);
                console.log('Statut de la réponse HTTP pour les graphiques:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                console.log('Données des graphiques reçues:', data);

                if (!data || !Array.isArray(data.labels) || !Array.isArray(data.carpoolData) || !Array.isArray(data.earningsData)) {
                    throw new Error('Données des graphiques invalides ou incomplètes.');
                }
                return data;

            } catch (error) {
                console.error("Erreur lors du chargement des données des graphiques:", error);
                const overviewTabPane = document.getElementById('overview'); // Cible l'onglet "Vue d'ensemble"
                if (overviewTabPane) {
                    overviewTabPane.innerHTML = '<p class="text-danger text-center mt-3">Impossible de charger les données des graphiques. Veuillez réessayer plus tard.</p>';
                }
                return null;
            }
        }

        // Fonction pour initialiser le graphique des Covoiturages
        function initCarpoolChart(data) {
            const carpoolCtx = document.getElementById('carpoolChart');
            if (carpoolCtx) {
                if (carpoolChartInstance) {
                    carpoolChartInstance.destroy();
                }
                carpoolChartInstance = new Chart(carpoolCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Nombre de Covoiturages',
                            data: data.carpoolData,
                            borderColor: 'rgba(165, 214, 167, 1)', // Bootstrap primary blue
                            backgroundColor: 'rgba(165, 214, 167, 0.5)', // Light primary blue
                            fill: true,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Nombre de Covoiturages' } },
                            x: { title: { display: true, text: 'Date' } }
                        }
                    }
                });
            } else {
                console.error("Élément canvas 'carpoolChart' non trouvé.");
            }
        }

        // Fonction pour initialiser le graphique des Crédits Gagnés
        function initEarningsChart(data) {
            const earningsCtx = document.getElementById('earningsChart');
            if (earningsCtx) {
                if (earningsChartInstance) {
                    earningsChartInstance.destroy();
                }
                earningsChartInstance = new Chart(earningsCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Crédits Gagnés',
                            data: data.earningsData,
                            backgroundColor: 'rgba(251, 192, 45, 0.5)',
                            borderColor: '#FBC02D',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Crédits' } },
                            x: { title: { display: true, text: 'Date' } }
                        }
                    }
                });
            } else {
                console.error("Élément canvas 'earningsChart' non trouvé.");
            }
        }

        // Initialiser les onglets Bootstrap
        var adminTabElement = document.getElementById('adminTab');
        if (adminTabElement) {
            var tabButtons = adminTabElement.querySelectorAll('[data-bs-toggle="tab"]');
            tabButtons.forEach(function(tabButton) {
                tabButton.addEventListener('shown.bs.tab', async function (event) {
                    // Récupérer les données une seule fois
                    if (!chartData) {
                        chartData = await fetchChartData();
                    }

                    if (chartData) {
                        // Initialiser les graphiques si l'onglet activé est la "Vue d'ensemble"
                        if (event.target.id === 'overview-tab') {
                            initCarpoolChart(chartData);
                            initEarningsChart(chartData);
                        }
                    }
                });
            });
        }

        // Récupérer les données initialement et initialiser les graphiques si l'onglet "Vue d'ensemble" est actif au chargement
        // Déclenche l'événement 'shown.bs.tab' pour l'onglet actif au chargement du DOM.
        fetchChartData().then(data => {
            chartData = data; // Stocker les données
            const overviewTabButton = document.getElementById('overview-tab');
            
            // Si l'onglet "Vue d'ensemble" est actif au chargement, déclencher son événement 'shown.bs.tab'
            if (overviewTabButton && overviewTabButton.classList.contains('active')) {
                // Utiliser setTimeout pour s'assurer que Bootstrap a eu le temps de rendre l'onglet
                // et que le canvas est visible pour Chart.js.
                setTimeout(() => {
                    // Créer un événement personnalisé 'shown.bs.tab' et le déclencher
                    // C'est une façon de simuler le clic sur l'onglet pour que la logique d'initialisation des graphiques s'exécute.
                    const shownEvent = new Event('shown.bs.tab', { bubbles: true, cancelable: true });
                    // Assurez-vous que l'objet event.target est correctement défini pour le listener
                    Object.defineProperty(shownEvent, 'target', { value: overviewTabButton, writable: true });
                    overviewTabButton.dispatchEvent(shownEvent);
                }, 100); // Un petit délai pour s'assurer que le DOM est prêt
            }
        });

        // Mettre à jour les totaux (Crédits et Voyages)
        // Cette fonction sera appelée après le chargement des données des graphiques
        async function updateTotalsFromChartData() {
            if (chartData) {
                const totalCredits = document.getElementById('totalCreditsGagnes');
                const totalTrips = document.getElementById('totalCovoituragesTermines');

                // Calculer le total des crédits gagnés à partir des données du graphique
                const calculatedTotalCredits = chartData.earningsData.reduce((sum, value) => sum + value, 0);
                // Calculer le total des voyages à partir des données du graphique
                const calculatedTotalTrips = chartData.carpoolData.reduce((sum, value) => sum + value, 0);

                if (totalCredits) totalCredits.textContent = calculatedTotalCredits;
                if (totalTrips) totalTrips.textContent = calculatedTotalTrips;
            }
        }

        // Appeler updateTotalsFromChartData après que les données des graphiques sont chargées
        fetchChartData().then(data => {
            chartData = data; // Stocker les données
            updateTotalsFromChartData(); // Mettre à jour les totaux
            
            // Puis initialiser les graphiques si l'onglet "Vue d'ensemble" est actif
            const overviewTabButton = document.getElementById('overview-tab');
            const overviewTabPane = document.getElementById('overview');
            if (overviewTabButton && overviewTabButton.classList.contains('active') && overviewTabPane && overviewTabPane.classList.contains('show')) {
                if (chartData) {
                    initCarpoolChart(chartData);
                    initEarningsChart(chartData);
                }
            }
        });


        // Activer la validation Bootstrap pour le formulaire
        (function () {
            'use strict'
            var forms = document.querySelectorAll('.needs-validation')
            Array.prototype.slice.call(forms)
                .forEach(function (form) {
                    form.addEventListener('submit', function (event) {
                        if (!form.checkValidity()) {
                            event.preventDefault()
                            event.stopPropagation()
                        }
                        form.classList.add('was-validated')
                    }, false)
                })
        })();
    });
})(); // Fin de l'IIFE principale encapsulant tout le script