(function() {
    let carpoolChartInstance = null;
    let earningsChartInstance = null;
    let chartData = null; 
    let adminApiChartDataUrl = null; 

    document.addEventListener('DOMContentLoaded', function() {
        const adminTabContentElement = document.getElementById('adminTabContent');
        if (adminTabContentElement && adminTabContentElement.dataset.apiUrl) {
            adminApiChartDataUrl = adminTabContentElement.dataset.apiUrl;
        } else {
            console.error("Erreur: L'attribut 'data-api-url' n'est pas trouvé sur l'élément '#adminTabContent'. Les graphiques ne peuvent pas être chargés.");
            return; 
        }

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
                const overviewTabPane = document.getElementById('overview'); 
                if (overviewTabPane) {
                    overviewTabPane.innerHTML = '<p class="text-danger text-center mt-3">Impossible de charger les données des graphiques. Veuillez réessayer plus tard.</p>';
                }
                return null;
            }
        }

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
                            borderColor: 'rgba(165, 214, 167, 1)', 
                            backgroundColor: 'rgba(165, 214, 167, 0.5)',
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

        var adminTabElement = document.getElementById('adminTab');
        if (adminTabElement) {
            var tabButtons = adminTabElement.querySelectorAll('[data-bs-toggle="tab"]');
            tabButtons.forEach(function(tabButton) {
                tabButton.addEventListener('shown.bs.tab', async function (event) {
                    if (!chartData) {
                        chartData = await fetchChartData();
                    }

                    if (chartData) {
                        if (event.target.id === 'overview-tab') {
                            initCarpoolChart(chartData);
                            initEarningsChart(chartData);
                        }
                    }
                });
            });
        }

        fetchChartData().then(data => {
            chartData = data;
            const overviewTabButton = document.getElementById('overview-tab');
            
            if (overviewTabButton && overviewTabButton.classList.contains('active')) {
                setTimeout(() => {
                    const shownEvent = new Event('shown.bs.tab', { bubbles: true, cancelable: true });
                    Object.defineProperty(shownEvent, 'target', { value: overviewTabButton, writable: true });
                    overviewTabButton.dispatchEvent(shownEvent);
                }, 100); 
            }
        });

        async function updateTotalsFromChartData() {
            if (chartData) {
                const totalCredits = document.getElementById('totalCreditsGagnes');
                const totalTrips = document.getElementById('totalCovoituragesTermines');

                const calculatedTotalCredits = chartData.earningsData.reduce((sum, value) => sum + value, 0);
                const calculatedTotalTrips = chartData.carpoolData.reduce((sum, value) => sum + value, 0);

                if (totalCredits) totalCredits.textContent = calculatedTotalCredits;
                if (totalTrips) totalTrips.textContent = calculatedTotalTrips;
            }
        }

        fetchChartData().then(data => {
            chartData = data; 
            updateTotalsFromChartData(); 
            const overviewTabButton = document.getElementById('overview-tab');
            const overviewTabPane = document.getElementById('overview');
            if (overviewTabButton && overviewTabButton.classList.contains('active') && overviewTabPane && overviewTabPane.classList.contains('show')) {
                if (chartData) {
                    initCarpoolChart(chartData);
                    initEarningsChart(chartData);
                }
            }
        });


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
})(); 