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
        'reference'          => 'S',
        'email'              => 'S',
        'name'               => 'S',
        'date_of_birth'      => 'S',
        'parent_name'        => 'S',
        'street'             => 'S',
        'postalcode'         => 'S',
        'city'               => 'S',
        'description'        => 'S',
        'gifts'              => 'S',
        'contact'            => 'S',
        'date_from'          => 'S',
        'date_to'            => 'S',
        'morning_from'       => 'S',
        'morning_to'         => 'S',
        'morning_amount'     => 'N',
        'afternoon_from'     => 'S',
        'afternoon_to'       => 'S',
        'afternoon_amount'   => 'S',
        'evening_from'       => 'S',
        'evening_to'         => 'S',
        'duration'           => 'N',
        'visits'             => 'S',
        'manage_token'       => 'S'
    ];

    
    /**
     * Check if this is a new page
     * 
     * @return boolean
     */
    public function isNew()
    {
        return $this->_is_new;
    }
    
    
    /**
     * Has any times set?
     * 
     * @return boolean
     */
    protected function hasAnyTimes()
    {
        return !empty($this->morning_from) || !empty($this->afternoon_from) || !empty($this->evening_from);
    }
    
    /**
     * Has times in the morning?
     * 
     * @return string|null
     */
    public function hasMorning()
    {
        return !$this->hasAnyTimes() ? null : (!empty($this->morning_from) ? 'yes' : 'no');
    }
    
    /**
     * Has times in the afternoon?
     * 
     * @return string|null
     */
    public function hasAfternoon()
    {
        return !$this->hasAnyTimes() ? null : (!empty($this->afternoon_from) ? 'yes' : 'no');
    }
    
    /**
     * Has times in the evening?
     * 
     * @return string|null
     */
    public function hasEvening()
    {
        return !$this->hasAnyTimes() ? null : (!empty($this->evening_from) ? 'yes' : 'no');
    }
    
    
    /**
     * Set the values of the page
     * 
     * @param array $values
     * @return $this
     */
    public function setAll(array $values = [])
    {
        $this->sanitizeValues($values);
        
        foreach ($values as $key => $value) {
            $this->set($key, $value);
        }
        
        return $this;
    }
    
    /**
     * Save the page
     * 
     * @param array $options
     * @return \Aws\Result
     */
    public function save(array $options = array())
    {
        if (!isset($this->reference)) {
            $this->reference = static::generateReference();
            $this->manage_token = static::generateReference();
        }
        
        return parent::save($options);
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
        
        if (isset($values['duration']) && is_array($values['duration'])) {
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
     * Get the link to the page
     * 
     * @return string
     */
    public function getLink()
    {
        if (!isset($this->reference)) {
            throw new RuntimeException("Reference not set");
        }
        
        return 'http://' . $_SERVER['HTTP_HOST'] . '/page/' . $this->reference;
    }
}
