<?php

/**
 * All hospitals
 */
class Hospitals extends ArrayObject
{
    /**
     * Load the hospitals
     * 
     * @return Hospitals
     */
    public static function load()
    {
        if (!file_exists('hospitals.csv')) {
            throw new RuntimeException("hospitals.csv not found");
        }
        
        $lines = file('hospitals.csv');
        array_shift($lines);
        
        $hospitals = [];
        foreach ($lines as $line) {
            $row = str_getcsv($line, ';');
            
            if ($row['4'] === 'Buitenpolikliniek') continue;
            
            $hospitals[] = (object)[
                'name' => $row[3],
                'address' => $row[5],
                'postalcode' => $row[6],
                'city' => $row[7]
            ];
        }
        
        return new self($hospitals);
    }

    /**
     * Get a search index
     * 
     * @return array
     */
    protected function getSearchIndex()
    {
        $index = [];
        
        foreach ($this as $i => $hospital) {
            $index[strtolower($hospital->name)] = $i;
            $index[strtolower($hospital->name . ', ' . $hospital->city)] = $i;
        }
        
        return $index;
    }
    
    /**
     * Find a hospital
     * 
     * @param string $location
     * @param stdClass|false
     */
    public function find($location)
    {
        $hospital = false;
        $index = $this->getSearchIndex();
        $key = strtolower($location);
        
        if (isset($index[$key])) {
            $i = $index[$key];
            $hospital = $this[$i];
        }
        
        return $hospital;
    }
    
    /**
     * Find a location
     * 
     * @param string $location
     * @return string|false
     */
    public function findAddress($location)
    {
        $hospital = $this->find($location);
        return $hospital ? $hospital->address . ', ' . $hospital->city : false;
    }
}
