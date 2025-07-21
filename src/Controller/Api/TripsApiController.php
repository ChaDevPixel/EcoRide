<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\Utilisateur; 


class TripsApiController extends AbstractController
{
    /**
     * @param SerializerInterface 
     * @return JsonResponse 
     */
    #[Route('/api/user/trips', name: 'api_user_trips', methods: ['GET'])]
    public function getUserTrips(SerializerInterface $serializer): JsonResponse
    {
        /** @var Utilisateur|null $user */
        $user = $this->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

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