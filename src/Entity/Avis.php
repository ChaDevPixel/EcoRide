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
    #[Groups(['avis_read'])] // Groupe pour une éventuelle API d'avis
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['avis_read'])]
    private ?string $commentaire = null;

    #[ORM\Column(type: Types::INTEGER)] // MODIFIÉ: Le type est maintenant integer pour les calculs
    #[Assert\Range(min: 1, max: 5)] // Assure que la note est bien entre 1 et 5
    #[Groups(['avis_read'])]
    private ?int $note = null; // MODIFIÉ

    #[ORM\ManyToOne(inversedBy: 'avis')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCommentaire(): ?string
    {
        return $this->commentaire;
    }

    public function setCommentaire(string $commentaire): static
    {
        $this->commentaire = $commentaire;

        return $this;
    }

    public function getNote(): ?int // MODIFIÉ
    {
        return $this->note;
    }

    public function setNote(int $note): static // MODIFIÉ
    {
        $this->note = $note;

        return $this;
    }

    public function getUtilisateur(): ?Utilisateur
    {
        return $this->utilisateur;
    }

    public function setUtilisateur(?Utilisateur $utilisateur): static
    {
        $this->utilisateur = $utilisateur;

        return $this;
    }
}
