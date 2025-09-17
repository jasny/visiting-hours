export type SlotState = 'disabled' | 'taken' | 'full' | 'available';

export interface CalendarDTO {
  dates: string[];
  times: string[];
  states: Record<string, Record<string, SlotState>>; // states[date][time]
}

export interface Visit {
  date: string;
  time: string;
  name: string;
  duration: number;
}

export interface Page {
  reference: string;
  email?: string;
  name?: string;
  date_of_birth?: string;
  parent_name?: string;
  street?: string;
  postalcode?: string;
  city?: string;
  description?: string;
  gifts?: string;
  contact?: string;
  date_from?: string;
  date_to?: string | null;
  morning_from?: string | null;
  morning_to?: string | null;
  morning_amount?: number | null;
  afternoon_from?: string | null;
  afternoon_to?: string | null;
  afternoon_amount?: number | null;
  evening_from?: string | null;
  evening_to?: string | null;
  evening_amount?: number | null;
  duration?: number | null;
  visits?: string | null;
  manage_token?: string;
  prepare?: boolean;
}
