<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Entity\Voiture;
use App\Repository\MarqueRepository;
use App\Repository\VoitureRepository;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class CarController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private VoitureRepository $voitureRepository;
    private Security $security;

    public function __construct(EntityManagerInterface $entityManager, VoitureRepository $voitureRepository, Security $security)
    {
        $this->entityManager = $entityManager;
        $this->voitureRepository = $voitureRepository;
        $this->security = $security;
    }

    /**
     * Ajoute un nouveau véhicule pour l'utilisateur connecté.
     */
    #[Route('/mon-compte/add-vehicle', name: 'app_add_vehicle', methods: ['POST'])]
    public function addVehicle(Request $request, ValidatorInterface $validator, MarqueRepository $marqueRepository): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->json(['success' => false, 'message' => 'Données JSON invalides.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $requiredFields = ['immatriculation', 'datePremiereImmatriculation', 'marqueId', 'modele', 'couleur', 'nombreDePlaces', 'energie', 'paysImmatriculation'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                return $this->json(['success' => false, 'message' => 'Le champ "' . $field . '" est manquant ou vide.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $marque = $marqueRepository->find($data['marqueId']);
        if (!$marque) {
            return $this->json(['success' => false, 'message' => 'Marque sélectionnée invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $voiture = new Voiture();
            $voiture->setImmatriculation($data['immatriculation']);
            $voiture->setDatePremiereImmatriculation(new DateTime($data['datePremiereImmatriculation']));
            $voiture->setMarque($marque);
            $voiture->setModele($data['modele']);
            $voiture->setCouleur($data['couleur']);
            $voiture->setNombreDePlaces((int)$data['nombreDePlaces']);
            $voiture->setEnergie($data['energie']);
            $voiture->setUtilisateur($utilisateur);
            $voiture->setPaysImmatriculation($data['paysImmatriculation']);

            $errors = $validator->validate($voiture);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return $this->json(['success' => false, 'message' => implode(' ', $errorMessages)], JsonResponse::HTTP_BAD_REQUEST);
            }

            $this->entityManager->persist($voiture);
            $this->entityManager->flush();

            return $this->json(['success' => true, 'message' => 'Véhicule ajouté avec succès !']);

        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => 'Une erreur serveur est survenue lors de l\'ajout du véhicule.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Vérifie si une plaque d'immatriculation existe déjà.
     */
    #[Route('/api/check-plate', name: 'api_check_plate', methods: ['POST'])]
    public function checkPlate(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $immatriculation = $data['immatriculation'] ?? null;

        if (!$immatriculation) {
            return new JsonResponse(['error' => 'Plaque d\'immatriculation manquante.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $voiture = $this->voitureRepository->findOneBy(['immatriculation' => $immatriculation]);

        if (!$voiture) {
            return new JsonResponse(['isUnique' => true]);
        }

        /** @var Utilisateur $currentUser */
        $currentUser = $this->security->getUser();

        if ($currentUser && $voiture->getUtilisateur() && $voiture->getUtilisateur()->getId() === $currentUser->getId()) {
            return new JsonResponse(['isUnique' => false, 'ownedByCurrentUser' => true]);
        } else {
            return new JsonResponse(['isUnique' => false, 'ownedByCurrentUser' => false]);
        }
    }

    /**
     * Récupère la liste de toutes les marques de véhicules.
     */
    #[Route('/api/marques', name: 'api_get_marques', methods: ['GET'])]
    public function getBrands(MarqueRepository $marqueRepository): JsonResponse
    {
        // --- DÉBUT DU BLOC DE CODE DE DIAGNOSTIC TEMPORAIRE (maintenant avec capture d'erreur) ---
        // Le code de diagnostic temporaire est supprimé, et le code original est réactivé avec un try-catch plus précis.
        try {
            // On trie par 'libelle' car c'est le nom de la propriété dans votre entité Marque
            $marques = $marqueRepository->findBy([], ['libelle' => 'ASC']);
            
            $marquesArray = [];
            foreach ($marques as $marque) {
                $marquesArray[] = [
                    'id' => $marque->getId(),
                    'nom' => $marque->getLibelle(), // Assurez-vous que votre entité Marque a bien un getLibelle()
                ];
            }
            
            return $this->json($marquesArray);

        } catch (\Exception $e) {
            // Capture l'exception et renvoie le message d'erreur exact au client.
            // Cela remplacera le 500 générique par un message plus utile.
            return $this->json(['error' => 'Erreur lors du chargement des marques: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        // --- FIN DU BLOC DE CODE DE DIAGNOSTIC TEMPORAIRE ---
    }

    /**
     * Récupère la liste des véhicules de l'utilisateur connecté.
     */
    #[Route('/api/user-vehicles', name: 'api_get_user_vehicles', methods: ['GET'])]
    public function getUserVehicles(): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur) {
            return $this->json([], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $voitures = $this->voitureRepository->findByUtilisateurWithMarque($utilisateur);

        
        $voituresArray = [];
        foreach ($voitures as $voiture) {
            $voituresArray[] = [
                'id' => $voiture->getId(),
                'immatriculation' => $voiture->getImmatriculation(),
                'modele' => $voiture->getModele(),
                'couleur' => $voiture->getCouleur(),
                'nombreDePlaces' => $voiture->getNombreDePlaces(),
                'energie' => $voiture->getEnergie(),
                'paysImmatriculation' => $voiture->getPaysImmatriculation(),
                'marque' => [
                    'nom' => $voiture->getMarque() ? $voiture->getMarque()->getLibelle() : 'N/A',
                ]
            ];
        }

        return $this->json($voituresArray);
    }
}