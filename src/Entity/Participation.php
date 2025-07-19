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
    #[Groups(['participation:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'participations')]
    #[ORM\JoinColumn(nullable: false)]
    // Le passager doit être exposé quand on lit une participation ('participation:read')
    // ou quand on lit un covoiturage qui inclut ses participations ('covoiturage:user_driven_read').
    // AJOUT: 'trip_info' pour exposer le passager dans notre API d'historique.
    #[Groups(['participation:read', 'covoiturage:user_driven_read', 'trip_info'])]
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

    #[ORM\Column]
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?bool $valideParPassager = false; // NOUVEAU : Indique si le passager a validé le trajet

    #[ORM\Column]
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?bool $avisSoumis = false; // NOUVEAU : Indique si le passager a soumis un avis

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

    // NOUVEAU : Getters et Setters pour valideParPassager
    public function isValideParPassager(): ?bool
    {
        return $this->valideParPassager;
    }

    public function setValideParPassager(bool $valideParPassager): static
    {
        $this->valideParPassager = $valideParPassager;
        return $this;
    }

    // NOUVEAU : Getters et Setters pour avisSoumis
    public function isAvisSoumis(): ?bool
    {
        return $this->avisSoumis;
    }

    public function setAvisSoumis(bool $avisSoumis): static
    {
        $this->avisSoumis = $avisSoumis;
        return $this;
    }
}