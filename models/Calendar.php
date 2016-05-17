<?php

/**
 * Calendar
 */
class Calendar
{
    /**
     * @var Page
     */
    protected $page;
    
    /**
     * @var array
     */
    protected $period_dates;
    
    /**
     * @var array
     */
    protected $visiting_times;

    /**
     * Class constructor
     * 
     * @param Page $page
     */
    public function __construct(Page $page)
    {
        $this->page = $page;
    }
    
    /**
     * Get the dates for the visiting schedule
     */
    public function getDates()
    {
        if (!isset($this->period_dates)) {
            $this->period_dates = [];

            $start = strtotime($this->page->date_from);
            $end = strtotime($this->page->date_to ?: ($this->page->date_from + (14 * 24 * 3600))) + (24 * 3600);

            for ($time = $start; $time < $end; $time += 24 * 3600) {
                $this->period_dates[] = date('Y-m-d', $time);
            }
        }
        
        return $this->period_dates;
    }
    
    /**
     * Get the visiting time
     * 
     * @return array
     */
    public function getVisitingTimes()
    {
        if (!isset($this->visiting_times)) {
            $this->visiting_times = [];

            if ($this->page->morning_from) {
                $this->visiting_times[] = ['from' => $this->page->morning_from, 'to' => $this->page->morning_to];
            }

            if ($this->page->afternoon_from) {
                $this->visiting_times[] = ['from' => $this->page->afternoon_from, 'to' => $this->page->afternoon_to];
            }

            if ($this->page->evening_from) {
                $this->visiting_times[] = ['from' => $this->page->evening_from, 'to' => $this->page->evening_to];
            }
        }
        
        return $this->visiting_times;
    }

    /**
     * Check if a time is a visiting time
     * 
     * @param int|string $time
     * @param int        $slotSize
     * @return boolean
     */
    protected function isVisitingTime($time, $slotSize = null)
    {
        if (is_string($time)) {
            list($timeHour, $timeMinutes) = explode(':', $time);
            $minutes = $timeHour * 60 + $timeMinutes;
        } else {
            $minutes = $time;
        }
        
        if (!isset($slotSize)) {
            $slotSize = $this->page->duration < 30 ? 15 : 30;
        }
        
        $timeFrom = self::minutesToTime($minutes);
        $timeTo = self::minutesToTime($minutes + $slotSize);
        
        foreach ($this->getVisitingTimes() as $visitingTime) {
            if ($timeFrom >= $visitingTime['from'] && $timeTo <= $visitingTime['to']) return true;
        }
        
        return false;
    }
    
    /**
     * Get the time slots for a day
     * 
     * @return array
     */
    public function getTimeSlots()
    {
        if (!isset($this->time_slots)) {
            $this->time_slots = [];

            $times = $this->getVisitingTimes();
            $slotSize = $this->page->duration < 30 ? 15 : 30;

            list($startHour, $startMin) = explode(':', reset($times)['from']);
            $start = $startHour * 60 + $startMin - $slotSize; // in minutes
            $start -= $start % $slotSize;

            list($endHour, $endMin) = explode(':', end($times)['to']);
            $end = $endHour * 60 + $endMin + $slotSize; // in minutes
            $end += $end % $slotSize;

            for ($time = $start; $time < $end; $time += $slotSize) {
                $slot = sprintf('%d:%02d', floor($time / 60), $time % 60);
                $this->time_slots[$slot] = $this->isVisitingTime($time, $slotSize);
            }
        }
        
        return $this->time_slots;
    }
    
    /**
     * Check if the day has the max number of visits planned
     * 
     * @param string $date
     * @return boolean
     */
    public function isDayFull($date)
    {
        if (!$this->page->number_visits) return false;
        
        $count = 0;
        
        foreach ($this->getVisits() as $visit) {
            if ($visit->date === $date) $count++;
        }
        
        return $count >= $this->page->number_visits;
    }
    
    /**
     * Check if slot is taken
     * 
     * @param string $date
     * @param string $time
     */
    public function isSlotTaken($date, $time)
    {
        foreach ($this->getVisits() as $visit) {
            if (
                $visit->date === $date &&
                $time >= $visit->time &&
                $time < self::timeAddMinites($visit->time, $this->page->duration)
            ) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get the state of a time slot
     * 
     * @param string $date
     * @param string $time
     */
    public function getSlotState($date, $time)
    {
        if (!$this->isVisitingTime($time)) return 'disabled';
        
        if (
            strtotime($date) < strtotime($this->page->date_from) ||
            strtotime($date) > strtotime($this->page->date_to)
        ) {
            return 'disabled';
        }
        
        if ($this->isSlotTaken($date, $time)) return 'taken';
        if ($this->isDayFull($date)) return 'full';
        return 'available';
    }
    
    
    /**
     * Get the visits
     * 
     * @return array
     */
    public function getVisits()
    {
        return $this->page->visits ? json_decode($this->page->visits) : [];
    }
    
    /**
     * Add a visit
     * 
     * @param string $date
     * @param string $time
     * @param string $name  Name of the person who is visiting
     */
    public function addVisit($date, $time, $name)
    {
        if ($this->getSlotState($date, $time) !== 'available') {
            throw new RuntimeException("Slot is not available");
        }
        
        $visit = compact('date', 'time', 'name');
        
        $visits = json_decode($this->page->visits);
        $visits[] = $visit;
        
        $this->page->visits = json_encode($visits);
    }
    
    /**
     * Remove a visit
     * 
     * @param string $date
     * @param string $time
     */
    public function removeVisit($date, $time)
    {
        $visits = json_decode($this->page->visits);
        $visits[] = $visit;

        foreach ($visits as $i => $visit) {
            if ($visit->date === $date && $visit->time === $time) {
                unset($visits[$i]);
            }
        }
        
        $this->page->visits = json_encode($visits);
    }
    
    
    /**
     * Add a number of minutes to a time
     * 
     * @param string $time
     * @param int    $addMinutes
     * @return string
     */
    protected static function timeAddMinites($time, $addMinutes)
    {
        list($timeHours, $timeMinutes) = explode(':', $time);
        
        $sum = ($timeHours * 60) + $timeMinutes + $addMinutes;
        return self::minutesToTime($sum);
    }
    
    /**
     * Turn minutes into a time string
     * 
     * @param int $minutes
     * @return string
     */
    public static function minutesToTime($minutes)
    {
        return sprintf('%02d:%02d', floor($minutes / 60), $minutes % 60);
    }
}
