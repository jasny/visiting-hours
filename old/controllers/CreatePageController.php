<?php

use Jasny\MVC\Controller;
use Kettle\ORM;

/**
 * Create a new page
 */
class CreatePageController extends Controller
{
    /**
     * The info about the page
     * @var Page
     */
    protected $info;
    
    /**
     * Class constructor
     * 
     * @param Jasny\MVC\Router $router
     */
    public function __construct($router = null)
    {
        parent::__construct($router);

        $info = isset($_SESSION['page']) ? $_SESSION['page'] : null;
        
        if (empty($info['reference'])) {
            $this->info = ORM::factory('Page')->create();
        } else {
            $this->info = ORM::factory('Page')->findOne($info['reference']);
            if (!$this->info) {
                $this->notFound();
                exit();
            }
        }
        
        if ($info) $this->info->setAll($info);
        
        if (isset($_GET['start'])) {
            $this->info->prepare = $_GET['start'] === 'prepare' ? true : false;
        }
    }
    
    /**
     * Class destructor
     */
    public function __destruct()
    {
        if (isset($this->info)) {
            $_SESSION['page'] = $this->info->asArray();
        } else {
            unset($_SESSION['page']);
        }
    }

    
    /**
     * Add input to info
     * 
     * @param boolean $done
     */
    protected function addInputToInfo($done = false)
    {
        $this->info->setAll($_POST);

        if (!$done) {
            $this->redirect($_SERVER['REQUEST_URI']);
        }
    }

    
    /**
     * Add a new page
     */
    public function newAction()
    {
        $this->info = null;
        $this->redirect('/create/step1' . (!empty($_GET) ? '?' . $_SERVER['QUERY_STRING'] : ''));
    }
    
    /**
     * Show 'basic-info' form
     */
    public function basicInfoAction()
    {
        if ($this->isPostRequest()) return $this->addInputToInfo();
        
        //$hospitals = Hospitals::load();
        
        $this->view('create-page/basic-info.html.twig');
    }

    /**
     * Show 'visiting' form
     */
    public function visitingAction()
    {
        if ($this->isPostRequest()) return $this->addInputToInfo();
        
        $this->view('create-page/visiting.html.twig');
    }
    
    /**
     * Add page
     */
    public function finishAction()
    {
        $this->addInputToInfo(true);
        
        $isNew = $this->info->isNew() || $this->info->hasChanged('prepare');
        
        $this->info->save();
        
        if ($isNew) {
            $email = Email::load($this->info->prepare ? 'register.html.twig' : 'publish.html.twig');
            $email->render(['info' => $this->info]);
            $email->addBCC('info@opkraambezoek.nl');
            $email->send($this->info->email, $this->info->parent_name);
        }
        
        $this->redirect('/create/done');
    }
    
    /**
     * All done
     */
    public function doneAction()
    {
        $this->redirect($this->info->getLink(), 302);
    }

    
    /**
     * Confirm to delete the page
     */
    public function confirmDeleteAction()
    {
        $this->view('confirm-delete.html.twig');
    }
    
    /**
     * Delete the page
     */
    public function deleteAction()
    {
        $this->info->delete();
        $this->redirect('/');
    }
    
    
    /**
     * Show a view
     *  
     * @param string $name     Name of the view
     * @param array  $context  Data for the view  
     */
    protected function view($name = null, $context = [])
    {
        $context += ['info' => $this->info];
        parent::view($name, $context);
    }
}
