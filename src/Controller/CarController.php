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
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class CarController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private VoitureRepository $voitureRepository;
    private Security $security;
    private SerializerInterface $serializer; 

    public function __construct(EntityManagerInterface $entityManager, VoitureRepository $voitureRepository, Security $security, SerializerInterface $serializer)
    {
        $this->entityManager = $entityManager;
        $this->voitureRepository = $voitureRepository;
        $this->security = $security;
        $this->serializer = $serializer; 
    }


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
            if (empty($data[$field])) {
                return $this->json(['success' => false, 'message' => 'Le champ "' . $field . '" est manquant ou vide.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }
        
        $existingVehicle = $this->voitureRepository->findOneBy(['immatriculation' => $data['immatriculation']]);
        if ($existingVehicle) {
            $message = 'Cette plaque d\'immatriculation est déjà utilisée';
            if ($existingVehicle->getUtilisateur() === $utilisateur) {
                $message .= ' par vous-même.';
            } else {
                $message .= ' par un autre membre.';
            }
            return $this->json(['success' => false, 'message' => $message], JsonResponse::HTTP_CONFLICT);
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
        try {
            $marques = $marqueRepository->findBy([], ['libelle' => 'ASC']);
            
            $marquesArray = [];
            foreach ($marques as $marque) {
                $marquesArray[] = [
                    'id' => $marque->getId(),
                    'nom' => $marque->getLibelle(),
                ];
            }
            
            return $this->json($marquesArray);

        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur lors du chargement des marques: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * CORRIGÉ : Récupère la liste des véhicules de l'utilisateur connecté en utilisant le Serializer.
     */
    #[Route('/api/user-vehicles', name: 'api_get_user_vehicles', methods: ['GET'])]
    public function getUserVehicles(): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur) {
            return $this->json([], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $voitures = $this->voitureRepository->findBy(['utilisateur' => $utilisateur]);

        $jsonVoitures = $this->serializer->serialize($voitures, 'json', [
            'groups' => ['voiture:read', 'marque:read']
        ]);

        return new JsonResponse($jsonVoitures, JsonResponse::HTTP_OK, [], true);
    }
}