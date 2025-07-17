<?php

namespace App\Entity;

use App\Repository\ParticipationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ParticipationRepository::class)]
class Participation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    // Ajout de 'covoiturage:user_driven_read' pour que l'ID de la participation soit visible
    // lorsque le covoiturage est sérialisé via ce groupe (par exemple, pour les covoiturages conduits par l'utilisateur).
    #[Groups(['participation:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'participations')]
    #[ORM\JoinColumn(nullable: false)]
    // Le passager doit être exposé quand on lit une participation ('participation:read')
    // ou quand on lit un covoiturage qui inclut ses participations ('covoiturage:user_driven_read').
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?Utilisateur $passager = null;

    #[ORM\ManyToOne(inversedBy: 'participations')]
    #[ORM\JoinColumn(nullable: false)]
    // Le covoiturage doit être exposé quand on lit une participation ('participation:read').
    // Il est crucial de NE PAS inclure ici les groupes 'covoiturage:read' ou 'covoiturage:user_driven_read'
    // pour éviter une référence circulaire avec la collection 'participations' de l'entité Covoiturage.
    #[Groups(['participation:read'])]
    private ?Covoiturage $covoiturage = null;

    #[ORM\Column]
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?\DateTimeImmutable $dateInscription = null;

    public function __construct()
    {
        $this->dateInscription = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPassager(): ?Utilisateur
    {
        return $this->passager;
    }

    public function setPassager(?Utilisateur $passager): static
    {
        $this->passager = $passager;
        return $this;
    }

    public function getCovoiturage(): ?Covoiturage
    {
        return $this->covoiturage;
    }

    public function setCovoiturage(?Covoiturage $covoiturage): static
    {
        $this->covoiturage = $covoiturage;
        return $this;
    }

    public function getDateInscription(): ?\DateTimeImmutable
    {
        return $this->dateInscription;
    }

    public function setDateInscription(\DateTimeImmutable $dateInscription): static
    {
        $this->dateInscription = $dateInscription;
        return $this;
    }
}