<?php

namespace App\Controller\Api;

use App\Entity\Covoiturage;
use App\Entity\Utilisateur;
use App\Repository\ParticipationRepository;
use App\Repository\VoitureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class CarpoolApiController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private SerializerInterface $serializer;
    private ValidatorInterface $validator;

    public function __construct(EntityManagerInterface $entityManager, Security $security, SerializerInterface $serializer, ValidatorInterface $validator)
    {
        $this->entityManager = $entityManager;
        $this->security = $security;
        $this->serializer = $serializer;
        $this->validator = $validator;
    }

    #[Route('/mon-compte/add-covoiturage', name: 'add_covoiturage', methods: ['POST'])]
    public function addCovoiturage(Request $request, VoitureRepository $voitureRepository): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $voiture = $voitureRepository->find($data['vehiculeId'] ?? 0);

        if (!$voiture || $voiture->getUtilisateur() !== $chauffeur) {
            return $this->json(['message' => 'Véhicule introuvable ou n\'appartient pas à l\'utilisateur.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage = new Covoiturage();
        $covoiturage->setVilleDepart($data['villeDepart']);
        $covoiturage->setDateDepart(new \DateTime($data['dateDepart']));
        $covoiturage->setHeureDepart($data['heureDepart']);
        $covoiturage->setVilleArrivee($data['villeArrivee']);
        $covoiturage->setDateArrivee(new \DateTime($data['dateArrivee']));
        $covoiturage->setHeureArrivee($data['heureArrivee']);
        $covoiturage->setPrix($data['prix']);
        $covoiturage->setEstAccompagne($data['estAccompagne']);
        $covoiturage->setNombreAccompagnateurs($data['estAccompagne'] ? ($data['nombreAccompagnateurs'] ?? 0) : 0);
        $covoiturage->setPlacesDisponibles($data['placesDisponibles']);
        $covoiturage->setStatut('initialise');
        $covoiturage->setChauffeur($chauffeur);
        $covoiturage->setVoiture($voiture);

        $errors = $this->validator->validate($covoiturage);
        if (count($errors) > 0) {
            return $this->json($errors, JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($covoiturage);
        $this->entityManager->flush();

        // SÉRIALISATION SIMPLIFIÉE ET CORRIGÉE
        $jsonCovoiturage = $this->serializer->serialize($covoiturage, 'json', [
            'groups' => ['covoiturage:read', 'voiture:read', 'marque:read', 'chauffeur:read']
        ]);

        return new JsonResponse([
            'message' => 'Covoiturage créé avec succès !',
            'covoiturage' => json_decode($jsonCovoiturage)
        ], JsonResponse::HTTP_CREATED);
    }

    #[Route('/user-covoiturages', name: 'get_user_covoiturages', methods: ['GET'])]
    public function getUserCovoiturages(): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $covoiturages = $chauffeur->getCovoituragesConduits()->toArray();
        
        // SÉRIALISATION SIMPLIFIÉE ET CORRIGÉE
        $jsonCovoiturages = $this->serializer->serialize($covoiturages, 'json', [
            'groups' => ['covoiturage:read', 'voiture:read', 'marque:read', 'chauffeur:read']
        ]);

        return new JsonResponse($jsonCovoiturages, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('/user-participations', name: 'get_user_participations', methods: ['GET'])]
    public function getUserParticipations(ParticipationRepository $participationRepository): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $participations = $participationRepository->findBy(['passager' => $user]);

        // La sérialisation ici était déjà correcte, on la garde.
        $jsonParticipations = $this->serializer->serialize($participations, 'json', [
            'groups' => ['participation:read', 'covoiturage:read', 'chauffeur:read']
        ]);

        return new JsonResponse($jsonParticipations, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('/covoiturage/{id}/start', name: 'covoiturage_start', methods: ['POST'])]
    public function startCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['message' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() !== 'initialise') {
            return $this->json(['message' => 'Le covoiturage ne peut être démarré que s\'il est "Non démarré".'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage->setStatut('en_cours');
        $this->entityManager->flush();

        return $this->json(['message' => 'Covoiturage démarré !', 'newStatus' => 'en_cours']);
    }

    #[Route('/covoiturage/{id}/end', name: 'covoiturage_end', methods: ['POST'])]
    public function endCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['message' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() !== 'en_cours') {
            return $this->json(['message' => 'Le covoiturage ne peut être terminé que s\'il est "En cours".'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage->setStatut('termine');
        $this->entityManager->flush();

        return $this->json(['message' => 'Covoiturage terminé !', 'newStatus' => 'termine']);
    }
}