import * as moment from "moment-timezone";
import { OpeningTimes, Space, AvailabilityCalendar } from "./types";

const formatDate = (date: Date): string =>
  moment.utc(date).format("YYYY-MM-DD");

const convertToSeconds = (date: string) => {
  const [hours, minutes, seconds] = date.slice(11, 19).split(":");
  const totalMilliseconds = +hours * 60 * 60 + +minutes * 60 + +seconds;

  return totalMilliseconds;
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

  if (currentTime.isBefore(spaceOpenTime)) {
    check = "is-opening";
  } else if (currentTime.isBetween(spaceOpenTime, spaceCloseTime)) {
    check = "is-open";
  } else if (currentTime.isAfter(spaceCloseTime)) {
    check = "is-closed";
  }

  return check;
};

const getAvailableTimes = (
  openTime: string,
  closeTime: string,
  minimumNotice: number
) => {
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

    if (minimumNotice) {
      current.add(minimumNotice, "minutes");
    }
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

  const { openingTimes, timeZone, minimumNotice } = space;

  const dates = getFutureDates(now, numberOfDays);

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

        if (getSpaceStatus(date, openTime, closeTime, timeZone) === "is-open") {
          // fetches availability for a space after the space has opened
          const availableTimes = getAvailableTimes(
            openTime,
            closeTime,
            minimumNotice
          );

          // Convert array of available times to seconds in order to compare
          const availableTimesInSeconds = availableTimes.map((time) =>
            convertToSeconds(time)
          );

          // Find next available time slot based on booking time
          const bookingDate = moment
            .utc(date)
            .tz(timeZone)
            .format("YYYY-MM-DD HH:mm:ss");
          const bookingTimeInSeconds = convertToSeconds(bookingDate);

          const nextAvailableTime = availableTimesInSeconds.find(
            (time) => bookingTimeInSeconds < time
          );

          const hours = (nextAvailableTime as number) / 3600;
          const minutes = ((nextAvailableTime as number) % 3600) / 60;
          const seconds = (nextAvailableTime as number) % 60;

          const availableBooking = moment(bookingDate)
            .hour(hours)
            .minute(minutes)
            .second(seconds)
            .format("YYYY-MM-DD HH:mm:ss");

          availability[formatDate(date)] = {
            open: {
              hour: parseInt(availableBooking.slice(11, 13)),
              minute: parseInt(availableBooking.slice(14, 16)),
            },
            close: {
              hour: parseInt(closeTime.slice(11, 13)),
              minute: parseInt(closeTime.slice(14, 16)),
            },
          };
        } else if (
          getSpaceStatus(date, openTime, closeTime, timeZone) === "is-opening"
        ) {
          availability[formatDate(date)] = openingTimes[dayOfTheWeek];
        } else if (
          getSpaceStatus(date, openTime, closeTime, timeZone) === "is-closed"
        ) {
          availability[formatDate(date)] = {};
        }
      }
    });
  });

  return availability;
};
