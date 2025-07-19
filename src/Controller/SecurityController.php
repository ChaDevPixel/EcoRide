<?php
// src/Controller/SecurityController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Utilisateur;
use App\Entity\Role;
use DateTime;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use App\Repository\NotificationRepository;
use Symfony\Component\HttpFoundation\File\Exception\FileException; // NOUVEAU
use Symfony\Component\String\Slugger\SluggerInterface; // NOUVEAU

class SecurityController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private NotificationRepository $notificationRepository;

    // Le constructeur reste le même, les nouvelles dépendances seront injectées directement dans la méthode 'update'
    public function __construct(EntityManagerInterface $entityManager, NotificationRepository $notificationRepository)
    {
        $this->entityManager = $entityManager;
        $this->notificationRepository = $notificationRepository;
    }

    #[Route('/connexion', name: 'app_login', methods: ['GET', 'POST'])]
    public function login(AuthenticationUtils $authenticationUtils): Response
    {
        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        return $this->render('connexion.html.twig', [
            'last_username' => $lastUsername,
            'error' => $error,
        ]);
    }

    #[Route('/deconnexion', name: 'app_logout', methods: ['GET'])]
    public function logout(): void
    {
        throw new \LogicException('This method can be blank - it will be intercepted by the logout key on your firewall.');
    }

    #[Route('/mon-compte', name: 'app_account')]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function account(): Response
    {
        if ($this->isGranted('ROLE_EMPLOYE')) {
            return $this->redirectToRoute('employee_dashboard');
        }

        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();

        if (!$utilisateur) {
            return $this->redirectToRoute('app_login');
        }

        // --- Préparation des données des véhicules pour le JSON ---
        $voituresArray = [];
        foreach ($utilisateur->getVoitures() as $voiture) {
            $voituresArray[] = [
                'id' => $voiture->getId(),
                'immatriculation' => $voiture->getImmatriculation(),
                'datePremiereImmatriculation' => $voiture->getDatePremiereImmatriculation() ? $voiture->getDatePremiereImmatriculation()->format('Y-m-d') : null,
                'marque' => [
                    'id' => $voiture->getMarque() ? $voiture->getMarque()->getId() : null,
                    'libelle' => $voiture->getMarque() ? $voiture->getMarque()->getLibelle() : 'Marque inconnue',
                ],
                'modele' => $voiture->getModele(),
                'couleur' => $voiture->getCouleur(),
                'nombreDePlaces' => $voiture->getNombreDePlaces(),
                'energie' => $voiture->getEnergie(),
                'paysImmatriculation' => $voiture->getPaysImmatriculation(),
            ];
        }
        // --- Fin de la préparation des données des véhicules ---

        // --- Préparation des données des préférences pour le JSON ---
        $preferencesArray = $utilisateur->getPreferences() ?? [];
        $preferencesArray = array_merge([
            'fumeurs_acceptes' => false,
            'animaux_acceptes' => false,
            'personnalisees' => [],
        ], $preferencesArray);
        // --- Fin de la préparation des données des préférences ---

        // MODIFIÉ : Le nom du template est 'compte.html.twig'
        return $this->render('compte.html.twig', [
            'utilisateur' => $utilisateur,
            'utilisateur_voitures_json' => json_encode($voituresArray, JSON_PRETTY_PRINT),
            'utilisateur_preferences_json' => json_encode($preferencesArray, JSON_PRETTY_PRINT),
        ]);
    }

    /**
     * NOUVEAU : Gère la mise à jour du profil (pseudo et photo)
     */
    #[Route('/mon-compte/modifier', name: 'app_account_update', methods: ['POST'])]
    public function updateProfile(Request $request, SluggerInterface $slugger): Response
    {
        /** @var \App\Entity\Utilisateur $user */
        $user = $this->getUser();

        // Mettre à jour le pseudo
        $newPseudo = $request->request->get('pseudo');
        if ($newPseudo && $newPseudo !== $user->getPseudo()) {
            $user->setPseudo($newPseudo);
            $this->addFlash('success', 'Votre pseudo a été mis à jour.');
        }

        // Gérer l'upload de la photo
        /** @var \Symfony\Component\HttpFoundation\File\UploadedFile $photoFile */
        $photoFile = $request->files->get('photo');

        if ($photoFile) {
            $originalFilename = pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename.'-'.uniqid().'.'.$photoFile->guessExtension();

            try {
                $photoFile->move(
                    $this->getParameter('photos_directory'), // Ce paramètre doit être configuré dans services.yaml
                    $newFilename
                );
                // Mettre à jour la propriété 'photo' pour stocker le nom du fichier
                $user->setPhoto($newFilename);
                $this->addFlash('success', 'Votre photo de profil a été mise à jour.');
            } catch (FileException $e) {
                $this->addFlash('error', 'Une erreur est survenue lors du téléchargement de votre photo.');
            }
        }

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $this->redirectToRoute('app_account');
    }


    #[Route('/mon-compte/notifications', name: 'app_account_notifications', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function allNotifications(): Response
    {
        // ... (le code de cette méthode reste inchangé)
        /** @var Utilisateur $user */
        $user = $this->getUser();

        $notifications = $this->notificationRepository->findBy(
            ['destinataire' => $user],
            ['creeLe' => 'DESC']
        );

        return $this->render('notification.html.twig', [
            'notifications' => $notifications,
            'utilisateur' => $user,
        ]);
    }

    #[Route('/inscription/etape-1-prepare', name: 'app_register_prepare', methods: ['POST'])]
    public function registerPrepare(Request $request): RedirectResponse
    {
        $session = $request->getSession();
        $nom = trim($request->request->get('nom'));
        $prenom = trim($request->request->get('prenom'));
        $email = trim($request->request->get('email'));
        $password = trim($request->request->get('password'));

        if (empty($nom) || empty($prenom) || empty($email) || empty($password)) {
            $this->addFlash('error', 'Veuillez remplir tous les champs de l\'étape 1.');
            return $this->redirectToRoute('app_login');
        }

        $existingUser = $this->entityManager->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            $this->addFlash('error', 'Cet email est déjà utilisé pour un compte existant.');
            return $this->redirectToRoute('app_login');
        }

        $session->set('registration_data_step1', [
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $email,
            'password' => $password,
        ]);

        $this->addFlash('info', 'Étape 1 validée. Veuillez compléter votre profil.');
        return $this->redirectToRoute('app_register_step2');
    }

    #[Route('/inscription/etape-2', name: 'app_register_step2', methods: ['GET', 'POST'])]
    public function registerStep2(
        Request $request,
        UserPasswordHasherInterface $passwordHasher
    ): Response {
        $session = $request->getSession();
        $step1Data = $session->get('registration_data_step1');

        if (!$step1Data) {
            $this->addFlash('error', 'Veuillez d\'abord compléter l\'étape 1 de l\'inscription.');
            return $this->redirectToRoute('app_login');
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setNom($step1Data['nom'] ?? '');
        $utilisateur->setPrenom($step1Data['prenom'] ?? '');
        $utilisateur->setEmail($step1Data['email'] ?? '');

        if ($request->isMethod('POST')) {
            $nom = trim($request->request->get('nom'));
            $prenom = trim($request->request->get('prenom'));
            $email = trim($request->request->get('email'));
            $password = trim($request->request->get('password'));

            $pseudo = trim($request->request->get('pseudo'));
            $adresse = trim($request->request->get('adresse'));
            $telephone = trim($request->request->get('telephone'));
            $dateNaissanceStr = $request->request->get('date_naissance');

            if (empty($nom) || empty($prenom) || empty($email) || empty($password) ||
                empty($pseudo) || empty($adresse) || empty($telephone) || empty($dateNaissanceStr)) {
                $this->addFlash('error', 'Veuillez remplir tous les champs du formulaire.');

                $utilisateur->setNom($nom); $utilisateur->setPrenom($prenom); $utilisateur->setEmail($email);
                $utilisateur->setPseudo($pseudo); $utilisateur->setAdresse($adresse); $utilisateur->setTelephone($telephone);
                if ($dateNaissanceStr) {
                    try {
                        $dateNaissance = new DateTime($dateNaissanceStr);
                        $utilisateur->setDateNaissance($dateNaissance);
                    } catch (\Exception $e) { /* L'erreur sera gérée par le flash message ci-dessous */ }
                }
                return $this->render('inscription_etape2.html.twig', [
                    'utilisateur' => $utilisateur,
                ]);
            }

            $existingUserCheck = $this->entityManager->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
            if ($existingUserCheck && $existingUserCheck->getEmail() !== $step1Data['email']) {
                $this->addFlash('error', 'Cet email est déjà utilisé pour un autre compte.');
                $utilisateur->setNom($nom); $utilisateur->setPrenom($prenom); $utilisateur->setEmail($email);
                $utilisateur->setPseudo($pseudo); $utilisateur->setAdresse($adresse); $utilisateur->setTelephone($telephone);
                if ($dateNaissanceStr) {
                    try {
                        $dateNaissance = new DateTime($dateNaissanceStr);
                        $utilisateur->setDateNaissance($dateNaissance);
                    } catch (\Exception $e) { /* L'erreur sera gérée par le flash message ci-dessous */ }
                }
                return $this->render('inscription_etape2.html.twig', ['utilisateur' => $utilisateur]);
            }

            $utilisateur->setNom($nom);
            $utilisateur->setPrenom($prenom);
            $utilisateur->setEmail($email);
            $utilisateur->setPseudo($pseudo);
            $utilisateur->setAdresse($adresse);
            $utilisateur->setTelephone($telephone);

            try {
                $dateNaissance = new DateTime($dateNaissanceStr);
                $utilisateur->setDateNaissance($dateNaissance);
            } catch (\Exception $e) {
                $this->addFlash('error', 'Date de naissance invalide.');
                $utilisateur->setNom($nom); $utilisateur->setPrenom($prenom); $utilisateur->setEmail($email);
                $utilisateur->setPseudo($pseudo); $utilisateur->setAdresse($adresse); $utilisateur->setTelephone($telephone);
                return $this->render('inscription_etape2.html.twig', [
                    'utilisateur' => $utilisateur,
                ]);
            }

            $file = $request->files->get('photo');
            if ($file) {
                $uploadDirectory = $this->getParameter('kernel.project_dir') . '/public/uploads/photos';
                if (!is_dir($uploadDirectory)) {
                    mkdir($uploadDirectory, 0777, true);
                }
                $fileName = uniqid() . '.' . $file->guessExtension();
                try {
                    $file->move($uploadDirectory, $fileName);
                    $utilisateur->setPhoto($fileName);
                } catch (\Exception $e) {
                    $this->addFlash('error', 'Erreur lors de l\'upload de la photo : ' . $e->getMessage());
                    $utilisateur->setNom($nom); $utilisateur->setPrenom($prenom); $utilisateur->setEmail($email);
                    $utilisateur->setPseudo($pseudo); $utilisateur->setAdresse($adresse); $utilisateur->setTelephone($telephone);
                    $utilisateur->setDateNaissance($dateNaissance);
                    return $this->render('inscription_etape2.html.twig', [
                        'utilisateur' => $utilisateur,
                    ]);
                }
            } else {
                if (!$utilisateur->getPhoto()) {
                    $utilisateur->setPhoto('default.png');
                }
            }

            $hashedPassword = $passwordHasher->hashPassword($utilisateur, $step1Data['password']);
            $utilisateur->setPassword($hashedPassword);

            $rolePassenger = $this->entityManager->getRepository(Role::class)->findOneBy(['libelle' => 'ROLE_PASSENGER']);
            if (!$rolePassenger) {
                throw $this->createNotFoundException('Le rôle ROLE_PASSENGER n\'existe pas en base de données. Assurez-vous de l\'avoir créé.');
            }
            $utilisateur->addRole($rolePassenger);

            $utilisateur->setCredits(20);

            $this->entityManager->persist($utilisateur);
            $this->entityManager->flush();

            $session->remove('registration_data_step1');

            $this->addFlash('success', 'Votre inscription est terminée avec succès ! Vous pouvez maintenant vous connecter.');
            return $this->redirectToRoute('app_login');
        }

        return $this->render('inscription_etape2.html.twig', [
            'utilisateur' => $utilisateur,
        ]);
    }

    #[Route('/mon-compte/update-roles', name: 'app_account_update_roles', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateRoles(Request $request): JsonResponse
    {
        $utilisateur = $this->getUser();

        if (!$utilisateur instanceof Utilisateur) {
            return new JsonResponse(['success' => false, 'message' => 'Utilisateur non trouvé ou non valide.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        $isPassengerChecked = $data['isPassengerChecked'] ?? false;
        $isDriverChecked = $data['isDriverChecked'] ?? false;

        if (!$isPassengerChecked && !$isDriverChecked) {
            return new JsonResponse(['success' => false, 'message' => 'Au moins un rôle (Passager ou Chauffeur) doit être sélectionné.'], Response::HTTP_BAD_REQUEST);
        }

        if ($isDriverChecked) {
            $dateNaissance = $utilisateur->getDateNaissance();
            if (!$dateNaissance) {
                return new JsonResponse(['success' => false, 'message' => 'Veuillez renseigner votre date de naissance pour devenir chauffeur.'], Response::HTTP_BAD_REQUEST);
            }

            $today = new DateTime();
            $age = $today->diff($dateNaissance)->y;

            if ($age < 18) {
                return new JsonResponse(['success' => false, 'message' => 'Vous devez avoir au moins 18 ans pour devenir chauffeur.'], Response::HTTP_FORBIDDEN);
            }
        }

        $rolePassenger = $this->entityManager->getRepository(Role::class)->findOneBy(['libelle' => 'ROLE_PASSENGER']);
        $roleDriver = $this->entityManager->getRepository(Role::class)->findOneBy(['libelle' => 'ROLE_DRIVER']);

        if (!$rolePassenger || !$roleDriver) {
            return new JsonResponse(['success' => false, 'message' => 'Erreur: Rôles système introuvables.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        foreach ($utilisateur->getRolesCollection() as $existingRole) {
            $utilisateur->removeRole($existingRole);
        }

        if ($isPassengerChecked) {
            $utilisateur->addRole($rolePassenger);
        }
        if ($isDriverChecked) {
            $utilisateur->addRole($roleDriver);
        }

        try {
            $this->entityManager->flush();

            $this->addFlash('success', 'Vos rôles ont été mis à jour avec succès. Veuillez vous reconnecter pour que les changements soient pleinement effectifs.');

            return new JsonResponse([
                'success' => true,
                'message' => 'Redirection nécessaire.',
                'redirectUrl' => $this->generateUrl('app_login')
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Erreur lors de la sauvegarde des rôles: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/mon-compte/update-preferences', name: 'app_account_update_preferences', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updatePreferences(Request $request): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();

        if (!$utilisateur instanceof Utilisateur) {
            return new JsonResponse(['success' => false, 'message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        $fumeursAcceptes = $data['fumeursAcceptes'] ?? false;
        $animauxAcceptes = $data['animauxAcceptes'] ?? false;
        $preferencesPersonnalisees = $data['preferencesPersonnalisees'] ?? [];

        $preferencesToSave = [
            'fumeurs_acceptes' => (bool) $fumeursAcceptes,
            'animaux_acceptes' => (bool) $animauxAcceptes,
            'personnalisees' => (array) $preferencesPersonnalisees,
        ];

        $utilisateur->setPreferences($preferencesToSave);

        try {
            $this->entityManager->flush();
            return new JsonResponse(['success' => true, 'message' => 'Préférences mises à jour avec succès.']);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Erreur lors de la sauvegarde des préférences: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}