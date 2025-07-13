<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Voiture;
use App\Entity\Marque;
use App\Entity\Utilisateur;
use App\Repository\MarqueRepository;
use App\Repository\VoitureRepository;
use DateTime;
use Exception;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Bundle\SecurityBundle\Security; // CORRECTION : Changement de l'import pour le service Security

class CarController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private VoitureRepository $voitureRepository;
    private Security $security; // CORRECTION : Le type hint reste 'Security' mais l'import a changé

    public function __construct(EntityManagerInterface $entityManager, VoitureRepository $voitureRepository, Security $security)
    {
        $this->entityManager = $entityManager;
        $this->voitureRepository = $voitureRepository;
        $this->security = $security;
    }

    /**
     * Ajoute un nouveau véhicule pour l'utilisateur connecté.
     * Gère la soumission du formulaire d'ajout de véhicule via AJAX.
     */
    #[Route('/mon-compte/add-vehicle', name: 'app_add_vehicle', methods: ['POST'])]
    public function addVehicle(Request $request, ValidatorInterface $validator, MarqueRepository $marqueRepository): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return new JsonResponse(['success' => false, 'message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données d'entrée
        $requiredFields = ['immatriculation', 'datePremiereImmatriculation', 'marqueId', 'modele', 'couleur', 'nombreDePlaces', 'energie', 'paysImmatriculation'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return new JsonResponse(['success' => false, 'message' => 'Le champ "' . $field . '" est manquant ou vide.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $marque = $marqueRepository->find($data['marqueId']);
        if (!$marque) {
            return new JsonResponse(['success' => false, 'message' => 'Marque sélectionnée invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

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
            return new JsonResponse(['success' => false, 'message' => implode(' ', $errorMessages)], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $this->entityManager->persist($voiture);
            $this->entityManager->flush();

            return new JsonResponse(['success' => true, 'message' => 'Véhicule ajouté avec succès !']);

        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Erreur lors de l\'ajout du véhicule : ' . $e->getMessage()], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Vérifie si une plaque d'immatriculation existe déjà et à qui elle appartient.
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
            // La plaque n'existe pas, elle est unique
            return new JsonResponse(['isUnique' => true]);
        }

        // La plaque existe, vérifier si elle appartient à l'utilisateur actuel
        /** @var Utilisateur $currentUser */
        $currentUser = $this->security->getUser();

        if ($currentUser && $voiture->getUtilisateur() && $voiture->getUtilisateur()->getId() === $currentUser->getId()) {
            // La plaque appartient à l'utilisateur actuel
            return new JsonResponse(['isUnique' => false, 'ownedByCurrentUser' => true]);
        } else {
            // La plaque appartient à un autre utilisateur
            return new JsonResponse(['isUnique' => false, 'ownedByCurrentUser' => false]);
        }
    }

    /**
     * Récupère la liste de toutes les marques de véhicules.
     */
    #[Route('/api/marques', name: 'api_get_marques', methods: ['GET'])]
    public function getBrands(SerializerInterface $serializer): JsonResponse
    {
        $marques = $this->entityManager->getRepository(Marque::class)->findAll();
        
        // Sérialise directement les entités Marque avec le groupe 'marques_read'
        $jsonContent = $serializer->serialize($marques, 'json', ['groups' => 'marques_read']);

        return new JsonResponse($jsonContent, Response::HTTP_OK, [], true);
    }

    /**
     * Récupère la liste des véhicules de l'utilisateur connecté.
     */
    #[Route('/api/user-vehicles', name: 'api_get_user_vehicles', methods: ['GET'])]
    public function getUserVehicles(SerializerInterface $serializer): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return new JsonResponse(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $voitures = $utilisateur->getVoitures();

        // Sérialiser la collection de véhicules en JSON en utilisant le groupe 'voiture_read'
        // Assurez-vous que votre entité Voiture a un groupe de sérialisation 'voiture_read'
        // et que les relations nécessaires (Marque, Modele, Utilisateur) sont également configurées pour la sérialisation
        $jsonContent = $serializer->serialize($voitures, 'json', ['groups' => 'voiture_read']);

        return new JsonResponse($jsonContent, Response::HTTP_OK, [], true);
    }
}
