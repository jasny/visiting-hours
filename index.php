<?php

use Jasny\MVC\Router;
use Jasny\MVC\View\Twig as View;
use Kettle\ORM;
use Dotenv;

if (strpos($_SERVER['SERVER_SOFTWARE'], 'PHP') === 0 && pathinfo($_SERVER['SCRIPT_NAME'], PATHINFO_EXTENSION) !== 'php') {
    return false;
}

require_once 'vendor/autoload.php';

set_include_path(__DIR__ . '/controllers' . PATH_SEPARATOR . __DIR__ . '/models' . PATH_SEPARATOR . __DIR__ . '/lib');

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

ORM::configure("key",    $_ENV['AWS_KEY']);
ORM::configure("secret", $_ENV['AWS_SECRET']);
ORM::configure("region", $_ENV['AWS_REGION']);

// In order to use DynamoDB Local, you need to set "base_url".
ORM::configure("base_url", $_ENV['AWS_BASE_URL']);
Locale::setDefault("nl_NL");

Jasny\MVC\View::$map['twig'] = 'Jasny\MVC\View\Twig';
View::init('templates');

$router = new Router([
    '/ +GET'                  => (object)['controller' => 'default',  'action' => 'frontpage'],
    '/create'                 => (object)['controller' => 'create-page', 'action' => 'new'],
    '/create/step1'           => (object)['controller' => 'create-page', 'action' => 'visiting'],
    '/create/step2'           => (object)['controller' => 'create-page', 'action' => 'basic-info'],
    '/create/finish +POST'    => (object)['controller' => 'create-page', 'action' => 'finish'],
    '/create/done   +GET'     => (object)['controller' => 'create-page', 'action' => 'done'],
    '/delete +GET'            => (object)['controller' => 'create-page', 'action' => 'confirm-delete'],
    '/delete +POST'           => (object)['controller' => 'create-page', 'action' => 'delete'],
    '/page/* +GET'            => (object)['controller' => 'show-page', 'action' => 'show', 'reference' => '$2'],
    '/page/*/calendar +GET'   => (object)['controller' => 'show-page', 'action' => 'calendar', 'reference' => '$2'],
    '/page/*/calendar +POST'  => (object)['controller' => 'show-page', 'action' => 'plan', 'reference' => '$2'],
    '/page/*/delete-visit'    => (object)['controller' => 'show-page', 'action' => 'delete-visit', 'reference' => '$2']
]);

session_start();

$router->execute();
