<?php

use Jasny\MVC\Controller;
use Kettle\ORM;

/**
 * Controller to show a page and plan
 */
class ShowPageController extends Controller
{
    const GOOGLE_API_KEY = 'AIzaSyB_uG1XhXROu87P-an0YUs0EPSTr-cY7QE';
    
    public function showAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        
        $this->view('show-page/page.html.twig', ['info' => $page, 'google_api_key' => self::GOOGLE_API_KEY]);
    }
    
    public function calendarAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        
        $calendar = $page->getCalendar();
        
        $context = ['info' => $page, 'calendar' => $calendar];
        $this->view('show-page/calendar.html.twig', $context);
    }
    
    public function planAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        
        $page->getCalendar()->addVisit($_POST['date'], $_POST['time'], $_POST['name']);
        $page->save();
        
        $this->flash('success', "Uw bezoek is ingepland.");
        $this->redirect("/page/{$page->reference}");
    }
}
