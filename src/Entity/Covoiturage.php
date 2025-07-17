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
    // Ajout de 'covoiturage:user_driven_read' pour la sérialisation des covoiturages conduits par l'utilisateur.
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read'])]
    private ?string $villeDepart = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read'])]
    private ?\DateTimeInterface $dateDepart = null;

    #[ORM\Column(length: 5)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read'])]
    private ?string $heureDepart = null;

    #[ORM\Column(length: 255)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'notification:read', 'covoiturage_for_participation:read', 'covoiturage:user_driven_read'])]
    private ?string $villeArrivee = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?\DateTimeInterface $dateArrivee = null;

    #[ORM\Column(length: 5)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?string $heureArrivee = null;

    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?int $prix = null;

    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?bool $estAccompagne = false;

    #[ORM\Column(nullable: true)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?int $nombreAccompagnateurs = null;

    #[ORM\Column]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?int $placesDisponibles = null;

    #[ORM\Column(length: 50)]
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?string $statut = null;

    #[ORM\ManyToOne(inversedBy: 'covoituragesConduits')]
    #[ORM\JoinColumn(nullable: false)]
    // Le chauffeur doit être sérialisé avec un groupe spécifique pour éviter les boucles.
    // 'chauffeur:read' doit être défini sur les propriétés de Utilisateur que vous voulez exposer.
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?Utilisateur $chauffeur = null;

    #[ORM\ManyToOne(targetEntity: Voiture::class, inversedBy: 'covoiturages')]
    #[ORM\JoinColumn(nullable: false)]
    // La voiture doit être sérialisée avec un groupe spécifique.
    // 'voiture:read' doit être défini sur les propriétés de Voiture.
    #[Groups(["covoiturage:read", "covoiturage:search_read", 'covoiturage_for_participation:read', 'notification:read', 'covoiturage:user_driven_read'])]
    private ?Voiture $voiture = null;

    /**
     * @var Collection<int, Participation>
     */
    #[ORM\OneToMany(mappedBy: 'covoiturage', targetEntity: Participation::class, orphanRemoval: true)]
    // TRÈS IMPORTANT : Incluez ici le groupe 'covoiturage:user_driven_read' pour que les participations
    // soient sérialisées lorsque vous lisez les covoiturages conduits par l'utilisateur.
    // Assurez-vous que l'entité Participation est configurée pour ne pas créer de boucle
    // (comme nous l'avons fait précédemment en limitant le groupe sur la relation covoiturage dans Participation).
    #[Groups(['covoiturage:read', 'covoiturage:user_driven_read'])]
    private Collection $participations;

    public function __construct()
    {
        $this->participations = new ArrayCollection();
    }

    // ... (Getters et Setters inchangés) ...
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
}
