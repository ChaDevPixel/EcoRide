
<!DOCTYPE html>
<html lang="fr">
    <head>

        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/EcoRide/public/asstes/scss/main.css">
        <title>EcoRide</title>

    </head>

    <body>
        <header>
            <nav class="navbar bg-primary px-3">
                <div class="container-fluid d-flex justify-content-between align-items-center">

                    <!-- Bloc gauche (Menu burger en mobile, nav en desktop) -->
                    <div class="d-flex align-items-center gap-2">
                        <!-- Menu burger mobile -->
                        <button class="navbar-toggler d-flex d-lg-none flex-column align-items-center px-2 py-1" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu" aria-controls="offcanvasMenu" aria-expanded="false" aria-label="Ouvrir le menu">
                            <i class="bi bi-list fs-1 text-light"></i>
                            <small class="btn-header text-light">Menu</small>
                        </button>

                        <!-- Navigation desktop -->
                        <ul class="navbar-nav flex-row gap-3 d-none d-lg-flex ms-3">
                            <li class="nav-item"><a class="nav-link text-light" href="/Ecoride/index.php">Accueil</a></li>
                            <li class="nav-item"><a class="nav-link text-light" href="/covoiturages.html">Covoiturages</a></li>
                            <li class="nav-item"><a class="nav-link text-light" href="/contact.html">Nous contacter</a></li>
                        </ul>
                    </div>

                    <!-- Logo centré -->
                    <div class="position-absolute start-50 translate-middle-x">
                        <a class="navbar-brand d-inline-flex" href="/EcoRide/index.php">
                            <img src="/EcoRide/img/logoEcoride.png" alt="Logo Ecoride" class="logo-ecoride">
                        </a>
                    </div>

                    <!-- Connexion / Compte -->
                    <div class="d-flex align-items-center justify-content-end gap-2">

                        <!-- VERSION DESKTOP -->
                        <div class="d-none d-lg-flex">
                             <a href="mon-compte.html" class="btn btn-light">Mon Compte</a>
                             <a href="/EcoRide/connexion.php" class="btn btn-light">Connexion</a>
                        </div>

                        <!-- VERSION MOBILE -->
                        <button class="navbar-toggler d-flex d-lg-none flex-column align-items-center px-2 py-1" type="button" onclick="location.href='mon-compte.html'">
                            <i class="bi bi-person-circle fs-1 text-light"></i>
                            <small class="btn-header text-light">Mon compte</small>
                        </button>
                       
                         <button class="navbar-toggler d-flex d-lg-none flex-column align-items-center px-2 py-1" type="button" onclick="location.href='connexion.php'">
                             <i class="bi bi-person-circle fs-1 text-light"></i>
                             <small class="btn-header text-light">Connexion</small>
                        </button>
                       

                    </div>

                </div>

                <!-- Menu déroulant mobile -->
                <div class="offcanvas offcanvas-start bg-primary text-light" tabindex="-1" id="offcanvasMenu" aria-labelledby="offcanvasMenuLabel">
                    <div class="offcanvas-header">
                        <h5 class="offcanvas-title" id="offcanvasMenuLabel">Menu</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Fermer"></button>
                    </div>
                    <div class="offcanvas-body p-0">
                        <ul class="navbar-nav flex-column">
                            <li class="nav-item">
                                <a class="nav-link text-light px-3 py-2" href="/Ecoride/index.php">Accueil</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link text-light px-3 py-2" href="/covoiturages.html">Covoiturages</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link text-light px-3 py-2" href="/contact.html">Nous contacter</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>

        <main class="bg-light">
            <!-- gros titre -->                    
            <div class="image-container position-relative">
                <img src="/EcoRide/img/image principale accueil.jpg" alt="Paysage route" class="img-fluid w-100" />
                
                <div class="overlay-big-title position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50"></div>
                
                <div class="big-title position-absolute top-50 start-50 translate-middle text-light text-center px-3 w-100">
                    <div class="container">
                        <h1 class="big-title-text">
                            Ensemble, réduisons notre impact carbone tout en faisant des économies et de belles rencontres sur la route
                        </h1>
                    </div>
                </div>
            </div>

            <!-- barre de recherche -->
            <div class="search-bar bg-secondary py-4">
                <div class="container text-center mb-2">
                    <p class="search-title text-dark m-0">
                        Trouvez votre covoiturage
                    </p>
                </div>
                <div class="container">
                    <form class="d-flex flex-column align-items-center">
                        <div class="d-flex flex-wrap justify-content-center gap-1">
                            <input type="text" class="form-control search-input" placeholder="Départ">
                            <input type="text" class="form-control search-input" placeholder="Destination">
                            <input type="date" class="form-control search-input">
                        </div>            
                            <button type="submit" class="search-button btn btn-success btn-sm w-40 w-md-auto">Rechercher</button>
                    </form>
                </div>
            </div>

            <!-- présentation Ecoride -->
            <section class="container my-5">
                
                <h2 class="text-center mb-5 display-5 text-primary">Ecoride, le covoiturage en toute confiance</h2>

                <!-- Carousel -->
                <div id="ecorideCarousel" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">

                        <!-- Slide 1 -->
                        <div class="carousel-item active bg-light py-5">
                            <div class="row align-items-center">
                                <div class="col-md-6 mb-4 mb-md-0">
                                    <img src="/EcoRide/img/equipe ecoride.png" alt="Équipe Ecoride" class="img-fluid rounded shadow">
                                </div>
                                <div class="col-md-6">
                                    <h3 class="fw-bold mb-3">Qui sommes-nous</h3>
                                    <p>
                                        Ecoride est une plateforme de covoiturage écoresponsable qui vise à faciliter les déplacements partagés
                                        tout en réduisant l'empreinte carbone. Notre équipe est composée de passionnés de mobilité durable,
                                        convaincus que chaque trajet peut faire la différence.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Slide 2 -->
                        <div class="carousel-item bg-light py-5">
                            <div class="row align-items-center flex-md-row-reverse">
                                <div class="col-md-6 mb-4 mb-md-0">
                                    <img src="/EcoRide/img/notre mission.jpg" alt="Notre mission" class="img-fluid rounded shadow">
                                </div>
                                <div class="col-md-6">
                                    <h3 class="fw-bold mb-3">Notre mission</h3>
                                    <p>
                                        Notre mission est de promouvoir un mode de transport plus respectueux de l’environnement, accessible à tous.
                                        Grâce à Ecoride, vous pouvez planifier vos trajets, trouver des compagnons de route de confiance, et contribuer
                                        activement à une société plus verte et solidaire.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contrôles -->
                    <button class="carousel-control-prev" type="button" data-bs-target="#ecorideCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon bg-dark rounded-circle p-3" aria-hidden="true"></span>
                        <span class="visually-hidden">Précédent</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#ecorideCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon bg-dark rounded-circle p-3" aria-hidden="true"></span>
                        <span class="visually-hidden">Suivant</span>
                    </button>
                </div>
            </section> 
        </main>                         

        <footer class="bg-primary text-light">
            <div class="d-flex align-items-center footer-bar">
                <div class="container-fluid">
                    <div class="d-flex justify-content-between">
                        <p class="mb-0 mt-0 ms-1.5">Nous contacter : ecoride@exemple.com</p>
                        <p class="mb-0 mt-0 me-1.5">Mentions légales</p>
                    </div>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    </body>
</html>