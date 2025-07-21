<?php

namespace App\Controller\Api;

use App\Entity\Avis;
use App\Entity\Covoiturage;
use App\Entity\Notification;
use App\Repository\AvisRepository;
use App\Repository\CovoiturageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/employee', name: 'api_employee_')]
#[IsGranted('ROLE_EMPLOYE')]
class EmployeeApiController extends AbstractController
{
    private EntityManagerInterface $em;
    private SerializerInterface $serializer;

    public function __construct(EntityManagerInterface $em, SerializerInterface $serializer)
    {
        $this->em = $em;
        $this->serializer = $serializer;
    }

    #[Route('/pending-reviews', name: 'get_pending_reviews', methods: ['GET'])]
    public function getPendingReviews(AvisRepository $avisRepository): JsonResponse
    {
        $reviews = $avisRepository->findBy(['valideParEmploye' => false, 'rejete' => false, 'raisonLitige' => null]);
        $jsonReviews = $this->serializer->serialize($reviews, 'json', ['groups' => 'avis:read']);
        return new JsonResponse($jsonReviews, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('/disputed-carpools', name: 'get_disputed_carpools', methods: ['GET'])]
    public function getDisputedCarpools(CovoiturageRepository $covoiturageRepository): JsonResponse
    {
        $carpools = $covoiturageRepository->findBy(['statut' => 'litige']);
        $jsonCarpools = $this->serializer->serialize($carpools, 'json', ['groups' => 'covoiturage:dispute_read']);
        return new JsonResponse($jsonCarpools, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('/reviews/{id}/approve', name: 'approve_review', methods: ['POST'])]
    public function approveReview(Avis $avis): JsonResponse
    {
        $avis->setValideParEmploye(true);
        $this->em->flush();
        return $this->json(['message' => 'Avis approuvé avec succès.']);
    }

    #[Route('/reviews/{id}/reject', name: 'reject_review', methods: ['POST'])]
    public function rejectReview(Avis $avis): JsonResponse
    {
        $avis->setRejete(true);
        $this->em->flush();
        return $this->json(['message' => 'Avis rejeté et déplacé dans l\'historique.']);
    }
    
    #[Route('/rejected-reviews', name: 'get_rejected_reviews', methods: ['GET'])]
    public function getRejectedReviews(AvisRepository $avisRepository): JsonResponse
    {
        $reviews = $avisRepository->findBy(['rejete' => true], ['creeLe' => 'DESC']);
        $jsonReviews = $this->serializer->serialize($reviews, 'json', ['groups' => 'avis:read']);
        return new JsonResponse($jsonReviews, JsonResponse::HTTP_OK, [], true);
    }

    /**
     * NOUVEAU : Gère la résolution et la clôture d'un litige.
     */
    #[Route('/disputes/{id}/resolve', name: 'resolve_dispute', methods: ['POST'])]
    public function resolveDispute(Covoiturage $covoiturage, Request $request): JsonResponse
    {
        if ($covoiturage->getStatut() !== 'litige') {
            return $this->json(['message' => 'Ce covoiturage n\'est pas en litige.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $decision = $data['decision'] ?? null;

        if (!in_array($decision, ['approve', 'reject'])) {
            return $this->json(['message' => 'Décision invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $moderationDetails = [
            'passagerContacte' => $data['passagerContacte'] ?? false,
            'commentairePassager' => $data['commentairePassager'] ?? '',
            'chauffeurContacte' => $data['chauffeurContacte'] ?? false,
            'commentaireChauffeur' => $data['commentaireChauffeur'] ?? '',
            'decisionFinale' => $decision,
            'dateCloture' => new \DateTime(),
        ];
        $covoiturage->setModerationDetails($moderationDetails);

        $avisEnLitige = null;
        foreach ($covoiturage->getAvis() as $avis) {
            if ($avis->getRaisonLitige()) {
                $avisEnLitige = $avis;
                break;
            }
        }

        if (!$avisEnLitige) {
            return $this->json(['message' => 'Impossible de trouver l\'avis lié à ce litige.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        if ($decision === 'approve') {
            $avisEnLitige->setValideParEmploye(true);
        } else { 
            $avisEnLitige->setRejete(true);
        }

        $chauffeur = $covoiturage->getChauffeur();
        $prixVoyage = $covoiturage->getPrix();
        $commission = 2;
        $gainChauffeur = $prixVoyage - $commission;
        $chauffeur->setCredits($chauffeur->getCredits() + $gainChauffeur);

        $covoiturage->setStatut('termine');

        $passager = $avisEnLitige->getAuteur();
        $decisionText = $decision === 'approve' ? 'validé' : 'rejeté';

        $notifChauffeur = new Notification();
        $notifChauffeur->setDestinataire($chauffeur);
        $notifChauffeur->setMessage(
            sprintf(
                'Le litige sur votre trajet %s -> %s a été clôturé. L\'avis a été %s et %d crédits vous ont été transférés.',
                $covoiturage->getVilleDepart(), $covoiturage->getVilleArrivee(), $decisionText, $gainChauffeur
            )
        );
        $this->em->persist($notifChauffeur);

        $notifPassager = new Notification();
        $notifPassager->setDestinataire($passager);
        $notifPassager->setMessage(
            sprintf(
                'Le litige que vous avez signalé pour le trajet %s -> %s a été résolu. L\'avis a été %s.',
                $covoiturage->getVilleDepart(), $covoiturage->getVilleArrivee(), $decisionText
            )
        );
        $this->em->persist($notifPassager);

        $this->em->persist($covoiturage);
        $this->em->persist($avisEnLitige);
        $this->em->persist($chauffeur);
        $this->em->flush();

        return $this->json(['message' => 'Le litige a été clôturé avec succès.']);
    }
    

    #[Route('/resolved-disputes', name: 'get_resolved_disputes', methods: ['GET'])]
    public function getResolvedDisputes(CovoiturageRepository $covoiturageRepository): JsonResponse
    {
        $carpools = $covoiturageRepository->findResolvedDisputes(); 
        $jsonCarpools = $this->serializer->serialize($carpools, 'json', ['groups' => 'covoiturage:dispute_read']);
        return new JsonResponse($jsonCarpools, JsonResponse::HTTP_OK, [], true);
    }
}