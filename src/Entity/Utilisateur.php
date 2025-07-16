<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Doctrine\ORM\Mapping\UniqueConstraint;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
#[ORM\Table(name: "utilisateur", uniqueConstraints: [new UniqueConstraint(name: "unique_email", columns: ["email"])])]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['covoiturage:read'])] // covoiturage_read -> covoiturage:read
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private ?string $nom = null;

    #[ORM\Column(length: 50)]
    private ?string $prenom = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank(message: "L'adresse email est obligatoire.")]
    #[Assert\Email(message: "Veuillez saisir une adresse email valide.")]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: "Le mot de passe est obligatoire.")]
    private ?string $password = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $telephone = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $adresse = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_naissance = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['covoiturage:search_read'])] // covoiturage_search_read -> covoiturage:search_read
    private ?string $photo = null;

    #[ORM\Column(length: 50, nullable: true)]
    // L'AJOUT IMPORTANT EST ICI
    #[Groups(['covoiturage:read', 'covoiturage:search_read', 'chauffeur:read'])]
    private ?string $pseudo = null;

    #[ORM\OneToMany(targetEntity: Avis::class, mappedBy: 'utilisateur', orphanRemoval: true)]
    private Collection $avis;

    #[ORM\ManyToMany(targetEntity: Role::class, inversedBy: 'utilisateurs')]
    private Collection $roles;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $credits = 0;

    #[ORM\OneToMany(targetEntity: Voiture::class, mappedBy: 'utilisateur', orphanRemoval: true)]
    private Collection $voitures;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['covoiturage:search_read'])] // covoiturage_search_read -> covoiturage:search_read
    private ?array $preferences = [];

    #[ORM\OneToMany(mappedBy: 'chauffeur', targetEntity: Covoiturage::class)]
    private Collection $covoituragesConduits;

    #[ORM\OneToMany(mappedBy: 'passager', targetEntity: Participation::class, orphanRemoval: true)]
    private Collection $participations;

    public function __construct()
    {
        $this->avis = new ArrayCollection();
        $this->roles = new ArrayCollection();
        $this->voitures = new ArrayCollection();
        $this->preferences = [];
        $this->covoituragesConduits = new ArrayCollection();
        $this->participations = new ArrayCollection();
    }
    
    #[Groups(['covoiturage:search_read'])] // covoiturage_search_read -> covoiturage:search_read
    public function getNoteMoyenne(): ?float
    {
        if ($this->avis->isEmpty()) {
            return null;
        }

        $total = 0;
        foreach ($this->avis as $avi) {
            $total += $avi->getNote();
        }

        return round($total / $this->avis->count(), 1);
    }

    // ... TOUS VOS GETTERS ET SETTERS RESTENT INCHANGÉS ...
    // --- GETTERS AND SETTERS ---

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;
        return $this;
    }

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): static
    {
        $this->prenom = $prenom;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(?string $telephone): static
    {
        $this->telephone = $telephone;
        return $this;
    }

    public function getAdresse(): ?string
    {
        return $this->adresse;
    }

    public function setAdresse(?string $adresse): static
    {
        $this->adresse = $adresse;
        return $this;
    }

    public function getDateNaissance(): ?\DateTimeInterface
    {
        return $this->date_naissance;
    }

    public function setDateNaissance(?\DateTimeInterface $date_naissance): static
    {
        $this->date_naissance = $date_naissance;
        return $this;
    }

    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    public function setPhoto(?string $photo): static
    {
        $this->photo = $photo;
        return $this;
    }

    public function getPseudo(): ?string
    {
        return $this->pseudo;
    }

    public function setPseudo(?string $pseudo): static
    {
        $this->pseudo = $pseudo;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = [];
        foreach ($this->roles as $role) {
            $roles[] = $role->getLibelle();
        }
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }
    
    public function getRolesCollection(): Collection
    {
        return $this->roles;
    }

    public function addRole(Role $role): static
    {
        if (!$this->roles->contains($role)) {
            $this->roles->add($role);
        }
        return $this;
    }

    public function removeRole(Role $role): static
    {
        $this->roles->removeElement($role);
        return $this;
    }

    public function eraseCredentials(): void
    {
        // $this->plainPassword = null;
    }

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
            $avi->setUtilisateur($this);
        }
        return $this;
    }

    public function removeAvi(Avis $avi): static
    {
        if ($this->avis->removeElement($avi)) {
            if ($avi->getUtilisateur() === $this) {
                $avi->setUtilisateur(null);
            }
        }
        return $this;
    }

    public function getCredits(): int
    {
        return $this->credits;
    }

    public function setCredits(int $credits): static
    {
        $this->credits = $credits;
        return $this;
    }

    /**
     * @return Collection<int, Voiture>
     */
    public function getVoitures(): Collection
    {
        return $this->voitures;
    }

    public function addVoiture(Voiture $voiture): static
    {
        if (!$this->voitures->contains($voiture)) {
            $this->voitures->add($voiture);
            $voiture->setUtilisateur($this);
        }
        return $this;
    }

    public function removeVoiture(Voiture $voiture): static
    {
        if ($this->voitures->removeElement($voiture)) {
            if ($voiture->getUtilisateur() === $this) {
                $voiture->setUtilisateur(null);
            }
        }
        return $this;
    }

    public function getPreferences(): ?array
    {
        return $this->preferences;
    }

    public function setPreferences(?array $preferences): static
    {
        $this->preferences = $preferences;
        return $this;
    }

    /**
     * @return Collection<int, Covoiturage>
     */
    public function getCovoituragesConduits(): Collection
    {
        return $this->covoituragesConduits;
    }

    public function addCovoituragesConduit(Covoiturage $covoituragesConduit): static
    {
        if (!$this->covoituragesConduits->contains($covoituragesConduit)) {
            $this->covoituragesConduits->add($covoituragesConduit);
            $covoituragesConduit->setChauffeur($this);
        }

        return $this;
    }

    public function removeCovoituragesConduit(Covoiturage $covoituragesConduit): static
    {
        if ($this->covoituragesConduits->removeElement($covoituragesConduit)) {
            if ($covoituragesConduit->getChauffeur() === $this) {
                $covoituragesConduit->setChauffeur(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Participation>
     */
    public function getParticipations(): Collection
    {
        return $this->participations;
    }

    public function addParticipation(Participation $participation): static
    {
        if (!$this->participations->contains($participation)) {
            $this->participations->add($participation);
            $participation->setPassager($this);
        }

        return $this;
    }

    public function removeParticipation(Participation $participation): static
    {
        if ($this->participations->removeElement($participation)) {
            // set the owning side to null (unless already changed)
            if ($participation->getPassager() === $this) {
                $participation->setPassager(null);
            }
        }

        return $this;
    }
}