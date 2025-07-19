<?php
// src/Controller/AdminController.php

namespace App\Controller;

use App\Entity\Role;
use App\Entity\Utilisateur;
use App\Repository\CovoiturageRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use DateTime; // Assurez-vous que DateTime est importé

#[Route('/admin')]
#[IsGranted('ROLE_ADMIN')] // Sécurise tout le contrôleur pour les admins uniquement
class AdminController extends AbstractController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    #[Route('/', name: 'admin_dashboard')]
    public function dashboard(UtilisateurRepository $userRepository, CovoiturageRepository $covoiturageRepository): Response
    {
        $users = $userRepository->findAll();
        
        // Calcul du total des crédits gagnés (2 crédits par participation sur les trajets terminés)
        $totalCreditsGagnes = $covoiturageRepository->getTotalPlatformCredits();
        
        // Compte le nombre total de covoiturages avec le statut 'terminé'
        $totalCovoituragesTermines = $covoiturageRepository->countFinishedCovoiturages();

        return $this->render('admin.html.twig', [
            'users' => $users,
            'totalCreditsGagnes' => $totalCreditsGagnes,
            'totalCovoituragesTermines' => $totalCovoituragesTermines, // Passer la nouvelle variable au template
        ]);
    }

    #[Route('/create-employee', name: 'admin_create_employee', methods: ['POST'])]
    public function createEmployee(Request $request, UserPasswordHasherInterface $passwordHasher): Response
    {
        $email = $request->request->get('email');
        $password = $request->request->get('password');
        $pseudo = $request->request->get('pseudo');
        
        // NOUVEAU : Récupération du nom et prénom depuis le formulaire
        $nom = $request->request->get('nom');
        $prenom = $request->request->get('prenom');

        // Validation simple (incluant nom et prénom)
        if (empty($email) || empty($password) || empty($pseudo) || empty($nom) || empty($prenom)) {
            $this->addFlash('error', 'Tous les champs (email, mot de passe, pseudo, nom, prénom) sont requis pour créer un employé.');
            return $this->redirectToRoute('admin_dashboard');
        }

        // Vérifier si l'email existe déjà
        $existingUser = $this->em->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            $this->addFlash('error', 'Un utilisateur avec cet email existe déjà.');
            return $this->redirectToRoute('admin_dashboard');
        }

        $employee = new Utilisateur();
        $employee->setEmail($email);
        $employee->setPseudo($pseudo);
        $employee->setNom($nom); // Définition du nom
        $employee->setPrenom($prenom); // Définition du prénom
        $employee->setPassword($passwordHasher->hashPassword($employee, $password));
        
        // NOUVEAU : Définition des valeurs par défaut pour les employés
        $employee->setAdresse('123 rue de l\'Ecologie, 75000 Paris');
        $employee->setDateNaissance(new DateTime('2025-01-01')); // Format YYYY-MM-DD
        $employee->setTelephone('0123456789');
        // FIN NOUVEAU

        // Assigner le rôle employé
        $roleEmploye = $this->em->getRepository(Role::class)->findOneBy(['libelle' => 'ROLE_EMPLOYE']);
        if ($roleEmploye) {
            $employee->addRole($roleEmploye);
        } else {
            // Gérer le cas où le rôle n'existe pas
            $this->addFlash('error', 'Le rôle "ROLE_EMPLOYE" est introuvable en base de données.');
            return $this->redirectToRoute('admin_dashboard');
        }
        
        $employee->setCredits(0); // Les employés n'ont pas de crédits

        $this->em->persist($employee);
        $this->em->flush();

        $this->addFlash('success', 'Le compte employé a été créé avec succès.');
        return $this->redirectToRoute('admin_dashboard');
    }

    #[Route('/user/{id}/suspend', name: 'admin_suspend_user', methods: ['POST'])]
    public function suspendUser(Utilisateur $user): Response
    {
        // Empêcher un admin de se suspendre lui-même
        if ($user->getId() === $this->getUser()->getId()) {
            $this->addFlash('error', 'Vous ne pouvez pas suspendre votre propre compte.');
            return $this->redirectToRoute('admin_dashboard');
        }

        // On utilise un statut pour la suspension. Assurez-vous d'avoir un champ 'statut' dans votre entité Utilisateur.
        $user->setStatut('suspendu');
        $this->em->flush();

        $this->addFlash('success', 'Le compte de ' . $user->getPseudo() . ' a été suspendu.');
        return $this->redirectToRoute('admin_dashboard');
    }

    #[Route('/api/chart-data', name: 'admin_api_chart_data', methods: ['GET'])]
    public function getChartData(CovoiturageRepository $covoiturageRepository): JsonResponse
    {
        $carpoolsByDay = $covoiturageRepository->countByDay();
        $earningsByDay = $covoiturageRepository->getPlatformCreditsByDay();

        $labels = [];
        $carpoolCounts = [];
        $earningsCounts = [];

        // Fusionner les dates des deux ensembles de données
        $allDates = array_unique(array_merge(array_keys($carpoolsByDay), array_keys($earningsByDay)));
        sort($allDates);

        foreach ($allDates as $date) {
            $labels[] = (new DateTime($date))->format('d/m');
            $carpoolCounts[] = $carpoolsByDay[$date] ?? 0;
            $earningsCounts[] = $earningsByDay[$date] ?? 0;
        }

        return $this->json([
            'labels' => $labels,
            'carpoolData' => $carpoolCounts,
            'earningsData' => $earningsCounts,
        ]);
    }
}