<?php

use Jasny\MVC\Controller;

/**
 * Default controller
 */
class DefaultController extends Controller
{
    /**
     * Show the front page
     */
    public function frontpageAction()
    {
        $this->view('frontpage.html.twig');
    }
}