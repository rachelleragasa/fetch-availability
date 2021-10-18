## Background

When a worker comes to book a coworking space, the apps fetch the available dates and times that the coworking space can be booked.

## The problem

Our coworking space operators would like to be able to specify how many minutes advance notice they get before a worker can book their coworking space. For instance, if it's 09:00 now and the coworking space operator wants at least 30 minutes advance notice, the earliest the worker should be able to create a booking for is 09:30.

These times are returned to a worker when they fetch availability for a space.

Times returned in the response should always be in increments of 15 minutes.

For instance, if it's currently 09:05 and the minimum advance notice is 30 minutes, the next available booking time will be 09:45.

## The existing data structures

### A Space

```json
{
  "name": "Super Space",
  "minimumNotice": 30,
  "openingTimes": {
    "1": {
      "open": {
        "hour": 9,
        "minute": 0
      },
      "close": {
        "hour": 17,
        "minute": 0
      }
    },
    "2": {
      "open": {
        "hour": 8,
        "minute": 30
      },
      "close": {
        "hour": 17,
        "minute": 0
      }
    },
    "3": {
      "open": {
        "hour": 9,
        "minute": 0
      },
      "close": {
        "hour": 17,
        "minute": 0
      }
    },
    "4": {
      "open": {
        "hour": 9,
        "minute": 0
      },
      "close": {
        "hour": 17,
        "minute": 0
      }
    },
    "5": {
      "open": {
        "hour": 9,
        "minute": 0
      },
      "close": {
        "hour": 16,
        "minute": 30
      }
    },
    "6": {}, // Closed
    "7": {} // Closed
  }
}
```

### The availability response

The returned data structure looks like this, with 6 June representing a day when a coworking space is open between 09:00 and 17:00 and 7 June representing a closed day:

```json
{
  "2020-06-01": {
    "open": {
      "hour": 9,
      "minute": 0
    },
    "close": {
      "hour": 17,
      "minute": 0
    }
  },
  "2020-07-01": {}
}
```

## The task

You should write the logic to be able to calculate the availability for a space given the time now for the requested number of days into the future and taking into account the minimum advance notice period.

For instance, if the function is called with the `now` parameter set to the date/time now and the `numberOfDays` parameter set to 7, the function should return the times the space is available from now, up to 7 days into the future.

Feel free to use any libraries you see fit.

Please add additional tests to cover scenarios which aren't currently covered in the existing tests.

## The logistics

If there's anything you don't fully understand, please reach out to us as soon as possible.

Please place your logic in `src/index.ts` and ensure the tests are passing before returning the completed task to us.

You can either host the task on Github and send us the Github link, or feel free to archive the project folder (without `node_modules`!) and send it back to us.
