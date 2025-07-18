<?php

namespace App\Entity;

use App\Repository\AvisRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AvisRepository::class)]
class Avis
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['avis:read', 'user:avis_read', 'covoiturage:user_driven_read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'avisRecus')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['avis:read'])]
    private ?Utilisateur $utilisateur = null; 

    #[ORM\ManyToOne(inversedBy: 'avisLaisses')]
    #[ORM\JoinColumn(nullable: false)] 
    #[Groups(['avis:read', 'covoiturage:dispute_read'])]
    private ?Utilisateur $auteur = null; 

    #[ORM\ManyToOne(inversedBy: 'avis')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['avis:read'])]
    private ?Covoiturage $covoiturage = null;

    #[ORM\Column]
    #[Assert\NotNull(message: "La note est obligatoire.")]
    #[Assert\Range(min: 1, max: 5, notInRangeMessage: "La note doit être entre 1 et 5.")]
    #[Groups(['avis:read', 'user:avis_read', 'covoiturage:user_driven_read'])]
    private ?int $note = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 500, maxMessage: "Le commentaire ne peut pas dépasser {{ limit }} caractères.")]
    #[Groups(['avis:read', 'user:avis_read', 'covoiturage:user_driven_read'])]
    private ?string $commentaire = null;

    #[ORM\Column]
    #[Groups(['avis:read', 'user:avis_read', 'covoiturage:user_driven_read'])]
    private ?\DateTimeImmutable $creeLe = null;

    #[ORM\Column]
    #[Groups(['avis:read', 'user:avis_read', 'covoiturage:user_driven_read'])]
    private ?bool $valideParEmploye = false;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['avis:read', 'user:avis_read', 'covoiturage:user_driven_read', 'covoiturage:dispute_read'])]
    private ?string $raisonLitige = null;

    #[ORM\Column(options: ['default' => false])] // NOUVEAU CHAMP
    #[Groups(['avis:read'])]
    private ?bool $rejete = false;

    public function __construct()
    {
        $this->creeLe = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUtilisateur(): ?Utilisateur { return $this->utilisateur; }
    public function setUtilisateur(?Utilisateur $utilisateur): static { $this->utilisateur = $utilisateur; return $this; }
    public function getAuteur(): ?Utilisateur { return $this->auteur; }
    public function setAuteur(?Utilisateur $auteur): static { $this->auteur = $auteur; return $this; }
    public function getCovoiturage(): ?Covoiturage { return $this->covoiturage; }
    public function setCovoiturage(?Covoiturage $covoiturage): static { $this->covoiturage = $covoiturage; return $this; }
    public function getNote(): ?int { return $this->note; }
    public function setNote(int $note): static { $this->note = $note; return $this; }
    public function getCommentaire(): ?string { return $this->commentaire; }
    public function setCommentaire(?string $commentaire): static { $this->commentaire = $commentaire; return $this; }
    public function getCreeLe(): ?\DateTimeImmutable { return $this->creeLe; }
    public function setCreeLe(\DateTimeImmutable $creeLe): static { $this->creeLe = $creeLe; return $this; }
    public function isValideParEmploye(): ?bool { return $this->valideParEmploye; }
    public function setValideParEmploye(bool $valideParEmploye): static { $this->valideParEmploye = $valideParEmploye; return $this; }
    public function getRaisonLitige(): ?string { return $this->raisonLitige; }
    public function setRaisonLitige(?string $raisonLitige): static { $this->raisonLitige = $raisonLitige; return $this; }

    public function isRejete(): ?bool // NOUVEAU GETTER
    {
        return $this->rejete;
    }

    public function setRejete(bool $rejete): static // NOUVEAU SETTER
    {
        $this->rejete = $rejete;
        return $this;
    }
}