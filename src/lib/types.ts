export type SlotState = 'disabled' | 'taken' | 'full' | 'available';

export interface Calendar {
  dates: string[];
  times: string[];
  states: Record<string, Record<string, SlotState>>;
}

export interface Slot {
  date: string;
  time: string;
  name: string;
  duration: number;
  state: SlotState;
}

export interface Page {
  reference: string;
  email: string;
  name: string;
  date_of_birth: string | null;
  parent_name: string;
  street: string | null;
  postalcode: string | null;
  city: string | null;
  description: string;
  gifts: string;
  date_from: string;
  date_to: string;
  morning_from: string;
  morning_to: string;
  morning_amount: number;
  afternoon_from: string;
  afternoon_to: string;
  afternoon_amount: number;
  evening_from: string;
  evening_to: string;
  evening_amount: number;
  duration: number;
  slots: Slot[];
  manage_token: string;
}
