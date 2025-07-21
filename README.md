# EcoRide : Votre Plateforme de Covoiturage Éco-responsable

Bienvenue sur **EcoRide**, une application web innovante conçue pour faciliter le covoiturage, promouvoir les déplacements écologiques et créer une communauté de conducteurs et de passagers engagés.

## 🛠️ **Déploiement Local : Guide Pas à Pas**

Ce guide vous permettra de configurer et de lancer l'application EcoRide sur votre machine locale.

### **Pré-requis :**

Avant de commencer, assurez-vous que les éléments suivants sont installés sur votre système :

* **PHP** (Version 8.2 ou supérieure recommandée, compatible avec votre projet Symfony).
* **Composer** (Gestionnaire de dépendances PHP).
* **Git** (Système de contrôle de version).
* **Serveur Web Local :** **XAMPP** (recommandé pour MariaDB/MySQL et Apache) ou WAMP Server.
    * Assurez-vous que les modules **Apache** et **MySQL/MariaDB** sont lancés.
* **Un éditeur de code** (ex: Visual Studio Code).

### **Étapes d'Installation :**

1.  **Cloner le Dépôt GitHub :**
    Ouvrez votre terminal (CMD ou PowerShell) et clonez le projet à l'emplacement souhaité :
    ```bash
    git clone [LIEN_HTTPS_DE_VOTRE_DEPOT_GITHUB]
    cd EcoRide
    ```

2.  **Installer les Dépendances Composer :**
    Allez dans le répertoire racine du projet EcoRide et installez toutes les dépendances PHP :
    ```bash
    composer install
    ```

3.  **Configuration de la Base de Données Locale :**

    * **Assurer le Démarrage de MySQL/MariaDB :**
        * Ouvrez le Panneau de Contrôle XAMPP/WAMP.
        * Démarrez les modules **Apache** et **MySQL/MariaDB**.
        * **Si MySQL/MariaDB ne démarre pas** (problème de port 3306) :
            1.  Ouvrez `C:\xampp\mysql\bin\my.ini` (ou l'équivalent WAMP).
            2.  Cherchez `port = 3306` sous `[mysqld]` et `[client]` et remplacez-le par `port = 3307`.
            3.  Sauvegardez le fichier et **redémarrez le module MySQL/MariaDB dans XAMPP/WAMP.**
        * **Si Apache ne démarre pas** (problème de port 80) :
            1.  Dans le Panneau de Contrôle XAMPP/WAMP, cliquez sur "Config" à côté d'Apache, puis "Apache (httpd.conf)".
            2.  Cherchez `Listen 80` et `ServerName localhost:80` et remplacez `80` par `8080`.
            3.  Sauvegardez et **redémarrez le module Apache.**

    * **Mettre à jour la `DATABASE_URL` dans `.env` :**
        * Ouvrez le fichier `.env` à la racine de votre projet.
        * Assurez-vous que la ligne `DATABASE_URL` pointe vers votre serveur MySQL/MariaDB local avec le **bon port** et le **bon mot de passe** (si vous en avez un).
        * **Exemple (si MySQL est sur le port 3307, et mot de passe `SQL141617Brechoz!`) :**
            ```dotenv
            # .env
            DATABASE_URL="mysql://root:SQL141617Brechoz!@127.0.0.1:3307/ecoride?serverVersion=8.0.32&charset=utf8mb4"
            APP_ENV=dev
            APP_SECRET="[Générez_votre_clé_ici_avec_php_bin/console_secrets:generate-keys]"
            ```
            *(N'oubliez pas de générer une `APP_SECRET` si ce n'est pas déjà fait : `php bin/console secrets:generate-keys`)*

    * **Créer le Schéma de la Base de Données et Intégrer les Données :**
        * Ces commandes vont vider, créer le schéma et remplir votre base de données locale avec les données de démo (fixtures).
        * **ATTENTION :** Ceci effacera toutes les données existantes dans la base `ecoride`.
        ```bash
        php bin/console doctrine:database:drop --force
        php bin/console doctrine:database:create
        php bin/console doctrine:migrations:migrate --no-interaction
        php bin/console doctrine:fixtures:load --no-interaction
        ```
        *Alternative pour charger les données à partir du fichier `database_init.sql` (si vous préférez) :*
        ```bash
        # Assurez-vous que vous avez déjà exécuté doctrine:database:drop et doctrine:database:create
        # Puis, exécutez le fichier SQL directement (adaptez le port si ce n'est pas 3306)
        mysql -u root -p --port=3307 ecoride < database_init.sql
        ```

4.  **Lancer le Serveur Local Symfony :**
    ```bash
    symfony server:start
    ```

5.  **Accéder à l'Application :**
    Ouvrez votre navigateur web et accédez à :
    * `http://127.0.0.1:8000/` (si votre serveur Symfony CLI est sur le port par défaut)
    * *(Si vous avez changé le port d'Apache en 8080 : `http://localhost:8080/` via XAMPP/WAMP)*

---

**Identifiants de Démonstration :**

Utilisez ces comptes pour tester les différents rôles et parcours au sein de l'application :

* **Administrateur :**
    * Email : `admin@ecoride.com`
    * Mot de passe : `MotDePasseSecure1!`
* **Chauffeur :**
    * Email : `chauffeur1@ecoride.com`
    * Mot de passe : `MonPassChauffeur1!`
* **Passager :**
    * Email : `passager1@ecoride.com`
    * Mot de passe : `PassagerPass1!`
* **Employé :**
    * Email : `lea.garcia@ecoride.com`
    * Mot de passe : `MonPassEmploye1!`

---

**Fonctionnalités Clés :**

* **Gestion des Utilisateurs :** Inscription, connexion, gestion de profil.
* **Covoiturages :** Recherche, proposition de trajets, détails.
* **Rôles Utilisateur :** Admin, Chauffeur, Passager, Employé avec accès différenciés.
* **Sécurité :** Mots de passe sécurisés, validation des données, protection CSRF.
* **Gestion des Véhicules :** Attribution et affichage des voitures pour les chauffeurs.
* **Historique :** Suivi des voyages passés en tant que chauffeur ou passager.
* **Préférences Conducteur :** Affichage des préférences spécifiques du chauffeur.

