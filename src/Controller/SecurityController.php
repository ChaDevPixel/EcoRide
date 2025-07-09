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

class SecurityController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    #[Route('/connexion', name: 'app_login', methods: ['GET'])]
    public function login(): Response
    {
        return $this->render('connexion.html.twig');
    }

    #[Route('/mon-compte', name: 'app_account')]
    public function account(): Response
    {
        
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        
        $utilisateur = $this->getUser(); 

        return $this->render('compte.html.twig', [
            'utilisateur' => $utilisateur,
        ]);
    }
    
    #[Route('/inscription/etape-1-prepare', name: 'app_register_prepare', methods: ['POST'])]
    public function registerPrepare(Request $request): RedirectResponse
    {
        $session = $request->getSession();
        
        $nom = trim($request->request->get('nom'));
        $prenom = trim($request->request->get('prenom'));
        $email = trim($request->request->get('email'));
        $password = $request->request->get('password');

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
            $password = $request->request->get('password'); 

            $pseudo = trim($request->request->get('pseudo'));
            $adresse = trim($request->request->get('adresse'));
            $telephone = trim($request->request->get('telephone'));
            $dateNaissanceStr = $request->request->get('date_naissance');

            
            if (empty($nom) || empty($prenom) || empty($email) || empty($password) ||
                empty($pseudo) || empty($adresse) || empty($telephone) || empty($dateNaissanceStr)) {
                
                $this->addFlash('error', 'Veuillez remplir tous les champs du formulaire.');

               
                $utilisateur->setNom($nom);
                $utilisateur->setPrenom($prenom);
                $utilisateur->setEmail($email);
                
                $utilisateur->setPseudo($pseudo);
                $utilisateur->setAdresse($adresse);
                $utilisateur->setTelephone($telephone);
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
               
                $utilisateur->setNom($nom);
                $utilisateur->setPrenom($prenom);
                $utilisateur->setEmail($email); 
                $utilisateur->setPseudo($pseudo);
                $utilisateur->setAdresse($adresse);
                $utilisateur->setTelephone($telephone);
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

            $hashedPassword = $passwordHasher->hashPassword($utilisateur, $password);
            $utilisateur->setPassword($hashedPassword);

            $roleUtilisateur = $this->entityManager->getRepository(Role::class)->findOneBy(['libelle' => 'ROLE_USER']);
            if (!$roleUtilisateur) {
                throw $this->createNotFoundException('Le rôle ROLE_USER n\'existe pas en base de données. Assurez-vous de l\'avoir créé.');
            }
            $utilisateur->setRole($roleUtilisateur);

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
}