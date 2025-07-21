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
    #[Groups(['participation:read', 'covoiturage:user_driven_read', 'trip_info'])]
    private ?Utilisateur $passager = null;

    #[ORM\ManyToOne(inversedBy: 'participations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['participation:read', 'trip_info'])]
    private ?Covoiturage $covoiturage = null;

    #[ORM\Column]
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?\DateTimeImmutable $dateInscription = null;

    #[ORM\Column]
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?bool $valideParPassager = false; 

    #[ORM\Column]
    #[Groups(['participation:read', 'covoiturage:user_driven_read'])]
    private ?bool $avisSoumis = false; 
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

    public function isValideParPassager(): ?bool
    {
        return $this->valideParPassager;
    }

    public function setValideParPassager(bool $valideParPassager): static
    {
        $this->valideParPassager = $valideParPassager;
        return $this;
    }

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