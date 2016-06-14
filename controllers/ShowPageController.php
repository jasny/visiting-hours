<?php

use Jasny\MVC\Controller;
use Kettle\ORM;

/**
 * Controller to show a page and plan
 */
class ShowPageController extends Controller
{
    const GOOGLE_API_KEY = 'AIzaSyB_uG1XhXROu87P-an0YUs0EPSTr-cY7QE';
    
    /**
     * User may manage the page
     * @var boolean
     */
    protected $manage;
    
    public function __construct($router = null)
    {
        parent::__construct($router);
        
        $reference = isset($router->getRoute()->reference) ? $router->getRoute()->reference : null;
        
        if ($this->isGetRequest() && isset($_GET['manage'])) {
            $this->manageAction($reference);
            exit();
        }
        
        $this->manage = isset($_SESSION['page']['reference']) && $_SESSION['page']['reference'] === $reference;
    }
    
    public function manageAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        
        if ($page->manage_token !== $_GET['manage']) {
            return $this->forbidden("Invalid manage token");
        }
        
        $_SESSION['page'] = $page->asArray();
        
        $url = preg_replace('/([\?\&]manage=[^\?\&]*)/i', '', $_SERVER['REQUEST_URI']);
        $this->redirect($url);
    }
    
    public function showAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        if ($page->prepare && !$this->manage) return $this->forbidden();
        
        $context = ['info' => $page, 'link' => $page->getLink(), 'google_api_key' => self::GOOGLE_API_KEY];
        $this->view('show-page/page.html.twig', $context);
    }
    
    public function calendarAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        if ($page->prepare && !$this->manage) return $this->forbidden();
        
        $calendar = $page->getCalendar();
        
        $context = ['info' => $page, 'calendar' => $calendar];
        $this->view('show-page/calendar.html.twig', $context);
    }
    
    public function planAction($reference)
    {
        $page = ORM::factory('Page')->findOne($reference);
        if (!$page) return $this->notFound();
        if ($page->prepare && !$this->manage) return $this->forbidden();
        
        $visit = $page->getCalendar()->addVisit($_POST['date'], $_POST['time'], $_POST['name']);
        $page->save();
        
        $this->flash('success', "Uw bezoek is ingepland.");

        Email::load('new-visit.html.twig')
            ->render(['info' => $page, 'visit' => $visit])
            ->send($page->email, $page->parent_name);
        
        $this->redirect("/page/{$page->reference}");
    }
    
    /**
     * Show a view
     * 
     * @param string $name
     * @param array  $context
     */
    protected function view($name = null, $context = [])
    {
        $context['manage'] = $this->manage;
        if (!isset($context['info']->name)) $context['info']->name = 'de baby';
        
        parent::view($name, $context);
    }
}
