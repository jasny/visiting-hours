<?php

/**
 * Render and send e-mail
 * 
 */
class Email extends PHPMailer
{
    protected static $config = [
        'host' => '',
        'username' => '',
        'password' => ''
    ];
    
    /** @var View */
    protected $view;
    
    /**
     * Class constructor
     * 
     * @param string $template
     */
    public function __construct($template)
    {
        if (!empty(App::config()->email->host)) {
            $this->IsSMTP();
            $this->Host = App::config()->email->host;
            $this->Port = isset(App::config()->email->port) ? App::config()->email->port : 25;
            if (!empty(App::config()->email->tls)) $this->SMTPSecure = "tls"; 
            if (!empty(App::config()->email->username)) {
                $this->SMTPAuth = true;
                $this->Username = App::config()->email->username;
                $this->Password = App::config()->email->password;
            }
        }
        
        $this->SetFrom(App::config()->email->from, App::config()->email->from_name);
        
        $this->view = View::load("email/$template");
        $this->SetFrom(App::config()->email->from, App::config()->email->from_name);
    }
    
    /**
     * Factory method
     * 
     * @param string $view
     * @return Email
     */
    public static function load($view)
    {
        return new self($view);
    }
    
    
    /**
     * Set mail subject
     * 
     * @param string $subject
     */
    public function setSubject($subject)
    {
       $this->Subject = $subject; 
    }
    
    /**
     * Render the e-mail message
     * 
     * @param string $context
     * @return Email $this
     */
    public function render($context)
    {
        $message = $this->view->render(['email' => $this] + $context);
        $this->msgHTML($message);
        
        return $this;
    }
    
    /**
     * Send the email
     * 
     * @param string $email_address
     * @param string $name
     * @return boolean
     */
    public function send($email_address=null, $name=null)
    {
        if (isset($email_address)) $this->addAddress($email_address, $name);
        
        $send = parent::send();
        $this->clearAddresses();
        
        if (!$send) throw new Exception($this->ErrorInfo);
    }
}
