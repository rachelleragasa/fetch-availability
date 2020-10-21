export interface Time {
  hour: number;
  minute: number;
}

export interface OpeningTimes {
  open?: Time;
  close?: Time;
}

export type AvailabilityCalendar = Record<string, OpeningTimes>;

export interface Space {
  openingTimes: Record<string, OpeningTimes>;
  minimumNotice: number;
  timeZone: string;
}
