<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/employee', name: 'employee_')]
#[IsGranted('ROLE_EMPLOYE')] // Sécurise l'ensemble du contrôleur pour les employés
class EmployeeController extends AbstractController
{
    /**
     * Affiche la page du tableau de bord de l'employé.
     */
    #[Route('/dashboard', name: 'dashboard')]
    public function dashboard(): Response
    {
        // Le rendu pointe maintenant vers un dossier "employee"
        return $this->render('employe.html.twig');
    }
}
