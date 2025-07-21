<?php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups; 

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notification:read'])] 
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'notifications')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $destinataire = null; 

    #[ORM\Column(length: 255)]
    #[Groups(['notification:read'])] 
    private ?string $message = null;

    #[ORM\Column]
    #[Groups(['notification:read'])] 
    private ?bool $estLue = false;

    #[ORM\Column]
    #[Groups(['notification:read'])] 
    private ?\DateTimeImmutable $creeLe = null;

    #[ORM\ManyToOne]
    #[Groups(['notification:read'])] 
    private ?Covoiturage $covoiturageAssocie = null;

    public function __construct()
    {
        $this->creeLe = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDestinataire(): ?Utilisateur
    {
        return $this->destinataire;
    }

    public function setDestinataire(?Utilisateur $destinataire): static
    {
        $this->destinataire = $destinataire;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;

        return $this;
    }

    public function isEstLue(): ?bool
    {
        return $this->estLue;
    }

    public function setEstLue(bool $estLue): static
    {
        $this->estLue = $estLue;

        return $this;
    }

    public function getCreeLe(): ?\DateTimeImmutable
    {
        return $this->creeLe;
    }

    public function setCreeLe(\DateTimeImmutable $creeLe): static
    {
        $this->creeLe = $creeLe;

        return $this;
    }

    public function getCovoiturageAssocie(): ?Covoiturage
    {
        return $this->covoiturageAssocie;
    }

    public function setCovoiturageAssocie(?Covoiturage $covoiturageAssocie): static
    {
        $this->covoiturageAssocie = $covoiturageAssocie;

        return $this;
    }
}