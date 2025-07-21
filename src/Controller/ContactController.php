<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class ContactController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function home(): Response
    {
        return $this->render('home.html.twig');
    }

    #[Route('/nous-contacter', name: 'app_contact', methods: ['GET', 'POST'])]
    public function contact(Request $request, MailerInterface $mailer): Response
    {
        if ($request->isMethod('POST')) {
            $firstname = trim($request->request->get('firstname'));
            $lastname = trim($request->request->get('lastname'));
            $emailUser = trim($request->request->get('email'));
            $subject = trim($request->request->get('subject')); 
            $message = trim($request->request->get('message'));


            if (!empty($firstname) && !empty($lastname) && !empty($emailUser) && !empty($subject) && !empty($message)) {
                
                $email = (new Email())
                    ->from($emailUser)
                    ->to('contact@ecoride.com')
                    ->subject('Contact Ecoride: ' . $subject) 
                    ->html($this->renderView('emails/contact_email.html.twig', [
                        'firstname' => $firstname,
                        'lastname' => $lastname,
                        'emailUser' => $emailUser,
                        'subject' => $subject, 
                        'message' => $message,
                    ]));

                try {
                    $mailer->send($email);
                    $this->addFlash('secondary', 'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.');
                } catch (\Exception $e) {
                    $this->addFlash('error', 'Une erreur est survenue lors de l\'envoi de votre message. Erreur: ' . $e->getMessage());
                }

                return $this->redirectToRoute('app_contact');
            } else {
                $this->addFlash('error', 'Veuillez remplir tous les champs du formulaire.');
            }
        }

        return $this->render('contact.html.twig');
    }
}