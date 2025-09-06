<?php

use Jasny\MVC\View\Twig as View;

/**
 * Render and send e-mail
 * 
 */
class Email extends PHPMailer
{
    protected static $config = [
        'host' => 'email-smtp.eu-west-1.amazonaws.com',
        'port' => 587,
        'tls' => true,
        'from' => [
            'email' => 'info@opkraambezoek.nl',
            'name' => 'Op kraambezoek'
        ]
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
        if (!empty(static::$config['host'])) {
            $this->useSMTP(static::$config + [
                'username' => $_ENV['SES_ACCESSKEY'],
                'password' => $_ENV['SES_SECRET'],
            ]);
        }
        
        $this->view = View::load("email/$template");
        $this->SetFrom(static::$config['from']['email'], static::$config['from']['name']);
    }

    /**
     * Configure sending email through SMTP
     * 
     * @param array $config
     */
    public function useSMTP($config)
    {
        $this->IsSMTP();
        $this->Host = $config['host'];
        $this->Port = isset($config['port']) ? $config['port'] : 25;
        if (!empty($config['tls'])) $this->SMTPSecure = "tls"; 
        if (!empty($config['username'])) {
            $this->SMTPAuth = true;
            $this->Username = $config['username'];
            $this->Password = $config['password'];
        }
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
        
        if (!$send) trigger_error($this->ErrorInfo, E_USER_WARNING);
    }
}
