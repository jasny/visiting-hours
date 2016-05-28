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
     * @var array
     */
    protected $info = [
        'morning' => 'no',
        'afternoon' => 'yes',
        'evening' => 'no',
        'duration' => [
            'hours' => 1,
            'minutes' => 0
        ]
    ];
    
    /**
     * Class constructor
     * 
     * @param Jasny\MVC\Router $router
     */
    public function __construct($router = null)
    {
        parent::__construct($router);
        
        if (isset($_SESSION['create-page'])) {
            $this->info = array_merge($this->info, $_SESSION['create-page']);
        }
        
        if (!empty($this->info['reference'])) {
            $this->redirect('/page/' . $this->info['reference']);
        }
    }
    
    /**
     * Class destructor
     */
    public function __destruct()
    {
        $_SESSION['create-page'] = $this->info;
    }

    
    /**
     * Get the link to the page
     * 
     * @return string
     */
    protected function getLinkToPage()
    {
        if (!isset($this->info['reference'])) {
            throw new RuntimeException("Reference not set");
        }
        
        return 'http://' . $_SERVER['HTTP_HOST']
            . ($_SERVER['SERVER_PORT'] == 80 ? '' : ':' . $_SERVER['SERVER_PORT'])
            . '/page/' . $this->info['reference'];
    }
    
    /**
     * Add input to info
     * 
     * @param boolean $done
     */
    protected function addInputToInfo($done = false)
    {
        $this->info = array_merge($this->info, $_POST);

        if (!$done) {
            $this->redirect($_SERVER['REQUEST_URI']);
        }
    }

    /**
     * Show 'basic-info' form
     */
    public function basicInfoAction()
    {
        if ($this->isPostRequest()) return $this->addInputToInfo();
        
        $hospitals = Hospitals::load();
        
        $this->view('create-page/basic-info.html.twig', compact('hospitals'));
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
        
        $page = ORM::factory('Page')->create($this->info);
        $page->save();

        $this->info['reference'] = $page->reference;
        
        $link = $this->getLinkToPage();
        $this->redirect($link);
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
