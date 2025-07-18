<?php

namespace App\Entity;

use App\Repository\CovoiturageRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CovoiturageRepository::class)]
class Covoiturage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?string $villeDepart = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?\DateTimeInterface $dateDepart = null;

    #[ORM\Column(length: 5)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?string $heureDepart = null;

    #[ORM\Column(length: 255)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?string $villeArrivee = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?\DateTimeInterface $dateArrivee = null;

    #[ORM\Column(length: 5)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?string $heureArrivee = null;

    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?int $prix = null;

    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?bool $estAccompagne = false;

    #[ORM\Column(nullable: true)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?int $nombreAccompagnateurs = null;

    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?int $placesDisponibles = null;

    #[ORM\Column(length: 50)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?string $statut = null;

    #[ORM\ManyToOne(inversedBy: 'covoituragesConduits')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?Utilisateur $chauffeur = null;

    #[ORM\ManyToOne(targetEntity: Voiture::class, inversedBy: 'covoiturages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(["covoiturage:read", "covoiturage:search_read", 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read', 'avis:read'])]
    private ?Voiture $voiture = null;

    /**
     * @var Collection<int, Participation>
     */
    #[ORM\OneToMany(mappedBy: 'covoiturage', targetEntity: Participation::class, orphanRemoval: true)]
    #[Groups(['covoiturage:read', 'covoiturage:user_driven_read'])]
    private Collection $participations;

    /**
     * @var Collection<int, Avis>
     */
    #[ORM\OneToMany(mappedBy: 'covoiturage', targetEntity: Avis::class, orphanRemoval: true)]
    #[Groups(['covoiturage:read', 'covoiturage:user_driven_read'])] // Expose les avis liés à ce covoiturage
    private Collection $avis;

    public function __construct()
    {
        $this->participations = new ArrayCollection();
        $this->avis = new ArrayCollection();
    }

    // ... (Getters et Setters existants) ...

    public function getId(): ?int { return $this->id; }
    public function getVilleDepart(): ?string { return $this->villeDepart; }
    public function setVilleDepart(string $villeDepart): static { $this->villeDepart = $villeDepart; return $this; }
    public function getDateDepart(): ?\DateTimeInterface { return $this->dateDepart; }
    public function setDateDepart(\DateTimeInterface $dateDepart): static { $this->dateDepart = $dateDepart; return $this; }
    public function getHeureDepart(): ?string { return $this->heureDepart; }
    public function setHeureDepart(string $heureDepart): static { $this->heureDepart = $heureDepart; return $this; }
    public function getVilleArrivee(): ?string { return $this->villeArrivee; }
    public function setVilleArrivee(string $villeArrivee): static { $this->villeArrivee = $villeArrivee; return $this; }
    public function getDateArrivee(): ?\DateTimeInterface { return $this->dateArrivee; }
    public function setDateArrivee(\DateTimeInterface $dateArrivee): static { $this->dateArrivee = $dateArrivee; return $this; }
    public function getHeureArrivee(): ?string { return $this->heureArrivee; }
    public function setHeureArrivee(string $heureArrivee): static { $this->heureArrivee = $heureArrivee; return $this; }
    public function getPrix(): ?int { return $this->prix; }
    public function setPrix(int $prix): static { $this->prix = $prix; return $this; }
    public function isEstAccompagne(): ?bool { return $this->estAccompagne; }
    public function setEstAccompagne(bool $estAccompagne): static { $this->estAccompagne = $estAccompagne; return $this; }
    public function getNombreAccompagnateurs(): ?int { return $this->nombreAccompagnateurs; }
    public function setNombreAccompagnateurs(?int $nombreAccompagnateurs): static { $this->nombreAccompagnateurs = $nombreAccompagnateurs; return $this; }
    public function getPlacesDisponibles(): ?int { return $this->placesDisponibles; }
    public function setPlacesDisponibles(int $placesDisponibles): static { $this->placesDisponibles = $placesDisponibles; return $this; }
    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }
    public function getChauffeur(): ?Utilisateur { return $this->chauffeur; }
    public function setChauffeur(?Utilisateur $chauffeur): static { $this->chauffeur = $chauffeur; return $this; }
    public function getVoiture(): ?Voiture { return $this->voiture; }
    public function setVoiture(?Voiture $voiture): static { $this->voiture = $voiture; return $this; }
    public function getParticipations(): Collection { return $this->participations; }
    public function addParticipation(Participation $participation): static { if (!$this->participations->contains($participation)) { $this->participations->add($participation); $participation->setCovoiturage($this); } return $this; }
    public function removeParticipation(Participation $participation): static { if ($this->participations->removeElement($participation)) { if ($participation->getCovoiturage() === $this) { $participation->setCovoiturage(null); } } return $this; }

    /**
     * @return Collection<int, Avis>
     */
    public function getAvis(): Collection
    {
        return $this->avis;
    }

    public function addAvi(Avis $avi): static
    {
        if (!$this->avis->contains($avi)) {
            $this->avis->add($avi);
            $avi->setCovoiturage($this);
        }
        return $this;
    }

    public function removeAvi(Avis $avi): static
    {
        if ($this->avis->removeElement($avi)) {
            // set the owning side to null (unless already changed)
            if ($avi->getCovoiturage() === $this) {
                $avi->setCovoiturage(null);
            }
        }
        return $this;
    }
}
