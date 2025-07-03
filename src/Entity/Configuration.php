<?php

namespace App\Entity;

use App\Repository\ConfigurationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ConfigurationRepository::class)]
class Configuration
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * @var Collection<int, Utilisateur>
     */
    #[ORM\OneToMany(targetEntity: Utilisateur::class, mappedBy: 'configuration')]
    private Collection $utilisateurs;

    /**
     * @var Collection<int, parametre>
     */
    #[ORM\OneToMany(targetEntity: parametre::class, mappedBy: 'configuration')]
    private Collection $parametre;

    public function __construct()
    {
        $this->utilisateurs = new ArrayCollection();
        $this->parametre = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return Collection<int, Utilisateur>
     */
    public function getUtilisateurs(): Collection
    {
        return $this->utilisateurs;
    }

    public function addUtilisateur(Utilisateur $utilisateur): static
    {
        if (!$this->utilisateurs->contains($utilisateur)) {
            $this->utilisateurs->add($utilisateur);
            $utilisateur->setConfiguration($this);
        }

        return $this;
    }

    public function removeUtilisateur(Utilisateur $utilisateur): static
    {
        if ($this->utilisateurs->removeElement($utilisateur)) {
            // set the owning side to null (unless already changed)
            if ($utilisateur->getConfiguration() === $this) {
                $utilisateur->setConfiguration(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, parametre>
     */
    public function getParametre(): Collection
    {
        return $this->parametre;
    }

    public function addParametre(parametre $parametre): static
    {
        if (!$this->parametre->contains($parametre)) {
            $this->parametre->add($parametre);
            $parametre->setConfiguration($this);
        }

        return $this;
    }

    public function removeParametre(parametre $parametre): static
    {
        if ($this->parametre->removeElement($parametre)) {
            // set the owning side to null (unless already changed)
            if ($parametre->getConfiguration() === $this) {
                $parametre->setConfiguration(null);
            }
        }

        return $this;
    }
}
