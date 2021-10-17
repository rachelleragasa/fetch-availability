import * as moment from "moment-timezone";
import { OpeningTimes, Space, AvailabilityCalendar } from "./types";

const formatDate = (date: Date): string =>
  moment.utc(date).format("YYYY-MM-DD");

const convertToSeconds = (str) => {
  const time = str.slice(11, 19);
  return time.split(":").reduce((acc, time) => 60 * acc + +time);
};

const handleTime = (date: string, timeZone?: string) => {
  let time;
  const utcDate = moment.utc(date);
  if (timeZone) {
    time = moment.tz(utcDate, timeZone).format("HH:mm:ss");
  } else {
    time = moment(utcDate).format("HH:mm:ss");
  }
  return time;
};

const getFutureDates = (date: Date, numberOfDays: number): Date[] => {
  const dates: Date[] = [];

  for (let i = 0; i < numberOfDays; i++) {
    dates.push(new Date(date.setDate(date.getDate() + i)));
  }

  return dates;
};

const getSpaceStatus = (
  now: Date,
  openTime: string,
  closeTime: string,
  timeZone: string
) => {
  const currentTime = moment.utc(now).tz(timeZone);
  const spaceOpenTime = moment.utc(openTime).tz(timeZone, true);
  const spaceCloseTime = moment.utc(closeTime).tz(timeZone, true);

  let check;

  if (spaceCloseTime.isBefore(spaceOpenTime)) {
    check =
      currentTime.isAfter(spaceOpenTime) ||
      currentTime.isBefore(spaceCloseTime);
  } else {
    check = currentTime.isBetween(spaceOpenTime, spaceCloseTime);
  }

  return check ? "open" : "closed";
};

const getAvailableTimes = (openTime: string, closeTime: string) => {
  const start = moment(openTime);
  const end = moment(closeTime);

  // round starting minutes up to nearest 15 (12 --> 15, 17 --> 30)
  // note that 59 will round up to 60, and moment.js handles that correctly
  start.minutes(Math.ceil(start.minutes() / 15) * 15);

  const result: string[] = [];
  const current = moment(start);

  while (current <= end) {
    result.push(current.format("YYYY-MM-DD HH:mm:ss"));
    current.add(15, "minutes");
  }

  return result;
};

/**
 * Fetches upcoming availability for a space
 * @param space The space to fetch the availability for
 * @param numberOfDays The number of days from `now` to fetch availability for
 * @param now The time now
 */
export const fetchAvailability = (
  space: Space,
  numberOfDays: number,
  now: Date
): Record<string, OpeningTimes> => {
  const availability: AvailabilityCalendar = {};

  const { openingTimes, timeZone } = space;

  const dates = getFutureDates(now, numberOfDays);
  // const currentTime = moment.utc(now).format("YYYYY-MM-DD HH:mm:ss");

  dates.map((date) => {
    Object.keys(openingTimes).forEach((day) => {
      const dayOfTheWeek = date.getDay() || 7; // So that getDay() starts from 1-7 instead of 0-6

      if (dayOfTheWeek === parseInt(day)) {
        const { open, close } = openingTimes[dayOfTheWeek];

        const openTime = moment(date)
          .set("hour", open?.hour || 0)
          .set("minute", open?.minute || 0)
          .format("YYYY-MM-DD HH:mm");
        const closeTime = moment(date)
          .set("hour", close?.hour || 0)
          .set("minute", close?.minute || 0)
          .format("YYYY-MM-DD HH:mm");

        if (getSpaceStatus(date, openTime, closeTime, timeZone) === "open") {
          // fetches availability for a space after the space has opened
          const availableTimes = getAvailableTimes(openTime, closeTime);

          // Convert array of available times to seconds in order to compare
          const availableTimesInSeconds = availableTimes.map((time) =>
            convertToSeconds(time)
          );

          // Find next available time slot based on booking time
          const bookingDate = moment.utc(date).format("YYYY-MM-DD HH:mm:ss");
          const bookingTimeInSeconds = convertToSeconds(bookingDate);

          const closest = availableTimesInSeconds.reduce((prev, curr) =>
            Math.abs(curr - bookingTimeInSeconds) <
            Math.abs(prev - bookingTimeInSeconds)
              ? curr
              : prev
          );

          const hours = closest / 3600;
          const minutes = (closest % 3600) / 60;
          const seconds = closest % 60;

          const availableBooking = moment(bookingDate)
            .set("hour", hours || 0)
            .set("minute", minutes || 0)
            .set("second", seconds || 0)
            .format("YYYY-MM-DD HH:mm:ss");

          const availableBookingTimeZone = handleTime(
            availableBooking,
            timeZone
          );
          // const currentClosingTimeZone = handleTime(closeTime, timeZone);

          availability[formatDate(date)] = {
            open: {
              hour: parseInt(availableBookingTimeZone.slice(0, 2)),
              minute: parseInt(availableBookingTimeZone.slice(3, 5)),
            },
            close: {
              hour: parseInt(closeTime.slice(11, 13)),
              minute: parseInt(closeTime.slice(14, 16)),
            },
          };
        } else {
          /**
           * TODO:
           *  1. Return open/close hours if current time is before opening hours
           *  2. Return {} if current time is after closing hours
           */
          availability[formatDate(date)] = openingTimes[dayOfTheWeek];
        }
      }
    });
  });

  return availability;
};
