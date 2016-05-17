<?php

use Kettle\ORM;

/**
 * Visiting hours Page
 */
class Page extends ORM
{
    protected $_table_name = 'VisitingHoursPage';
    protected $_hash_key   = 'reference';
    protected $_schema = [
        'reference'      => 'S',
        'email'          => 'S',
        'name'           => 'S',
        'location'       => 'S',
        'floor'          => 'S',
        'room'           => 'S',
        'description'    => 'S',
        'contact'        => 'S',
        'date_from'      => 'S',
        'date_to'        => 'S',
        'morning_from'   => 'S',
        'morning_to'     => 'S',
        'afternoon_from' => 'S',
        'afternoon_to'   => 'S',
        'evening_from'   => 'S',
        'evening_to'     => 'S',
        'duration'       => 'N',
        'number_visits'  => 'N',
        'visits'         => 'S'
    ];
    
    protected $location_address;
    
    /**
     * Class constructor
     */
    public function __construct()
    {
        parent::__construct();
        
        $this->reference = static::generateReference();
    }
    
    /**
     * Set the values of the page
     * 
     * @param array $values
     * @return $this
     */
    public function hydrate(array $values)
    {
        $this->sanitizeValues($values);
        return parent::hydrate($values);
    }
    
    /**
     * Sanitize the page
     * 
     * @param array $values
     */
    protected function sanitizeValues(array &$values)
    {
        if (isset($values['morning']) && $values['morning'] === 'no') {
            $values['morning_from'] = null;
            $values['morning_to'] = null;
        }
        
        if (isset($values['afternoon']) && $values['afternoon'] === 'no') {
            $values['afternoon_from'] = null;
            $values['afternoon_to'] = null;
        }
        
        if (isset($values['evening']) && $values['evening'] === 'no') {
            $values['evening_from'] = null;
            $values['evening_to'] = null;
        }
        
        if (is_array($values['duration'])) {
            $values['duration'] = ($values['duration']['hours'] * 60) + $values['duration']['minutes'];
        }
    }
    
    /**
     * Generate a reference
     * 
     * @return string
     */
    protected static function generateReference()
    {
        return substr(base_convert(md5(microtime()), 16, 36), 0, 8);
    }
    
    /**
     * Get the calendar
     * 
     * @return Calendar
     */
    public function getCalendar()
    {
        return new Calendar($this);
    }
    
    
    /**
     * Get the address of the location
     * 
     * @return string
     */
    public function getLocationAddress()
    {
        if (!isset($this->location_address)) {
            $hospitals = Hospitals::load();
            $this->location_address = $hospitals->findAddress($this->location);
        }
        
        return $this->location_address ?: null;
    }
}
