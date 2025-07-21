<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications', name: 'api_notifications_')]
#[IsGranted('ROLE_USER')]
class NotificationController extends AbstractController
{

    #[Route('', name: 'get', methods: ['GET'])]
    public function getNotifications(NotificationRepository $notificationRepository): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();

        $notifications = $notificationRepository->findBy(
            ['destinataire' => $user],
            ['creeLe' => 'DESC'],
            10
        );

        $unreadCount = $notificationRepository->count(['destinataire' => $user, 'estLue' => false]);

        return $this->json([
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ], 200, [], ['groups' => ['notification:read', 'covoiturage_for_notification:read']]);
    }

    #[Route('/mark-as-read', name: 'mark_as_read', methods: ['POST'])]
    public function markAsRead(NotificationRepository $notificationRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        
        $unreadNotifications = $notificationRepository->findBy(['destinataire' => $user, 'estLue' => false]);

        foreach ($unreadNotifications as $notification) {
            $notification->setEstLue(true);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Notifications marquées comme lues.']);
    }
}