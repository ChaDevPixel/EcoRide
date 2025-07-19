<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\Utilisateur; // Assurez-vous que le chemin vers votre entité Utilisateur est correct

/**
 * Ce contrôleur gère les points d'API liés aux voyages (covoiturages).
 */
class TripsApiController extends AbstractController
{
    /**
     * Récupère et retourne tous les voyages (en tant que chauffeur et passager)
     * pour l'utilisateur actuellement authentifié.
     *
     * @param SerializerInterface $serializer L'outil pour convertir les objets PHP en JSON.
     * @return JsonResponse La réponse JSON contenant les listes de voyages.
     */
    #[Route('/api/user/trips', name: 'api_user_trips', methods: ['GET'])]
    public function getUserTrips(SerializerInterface $serializer): JsonResponse
    {
        /** @var Utilisateur|null $user */
        $user = $this->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        // CORRECTION : Utilisation des noms de méthode corrects basés sur vos entités.
        // Assurez-vous que ces méthodes existent bien dans votre entité Utilisateur.php
        $driverTrips = $user->getCovoituragesConduits(); 
        $participations = $user->getParticipations();

        $passengerTrips = [];
        foreach ($participations as $participation) {
            $passengerTrips[] = $participation->getCovoiturage();
        }

        $data = [
            'driver_trips' => $driverTrips,
            'passenger_trips' => $passengerTrips,
        ];

        return $this->json($data, 200, [], ['groups' => 'trip_info']);
    }
}