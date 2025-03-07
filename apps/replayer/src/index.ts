import bodyParser from "body-parser";
import { exec } from "child_process";
import cors from "cors";
import express from "express";
import fileUpload from "express-fileupload";
import { writeFile } from "fs/promises";
import "isomorphic-fetch";
import {
  RunInfo,
  RunRequest,
  RunStatus,
  UserInteraction,
  WheelEventPayload,
} from "kave-common";
import { promisify } from "util";
import { FALSE_CURSOR_CODE } from "./false-cursor";
import puppeteer from "puppeteer-extra";
import { Browser, Page } from "puppeteer";
import {
  initializeDebugEventIndexDisplay,
  updateDebugEventIndexDisplay,
} from "./debug-event-idx";

const execAsync = promisify(exec);

const FRAMERATE = 30;
const NATIVE_DEVICE_PIXEL_RATIO = 1;
const port = process.env.PORT || 20001;
const optimizeRender = false;
const interpolateMouseMove = false;

// this is the time after a click that we'll force rendering frames even if there are no other events.
const clickEnvelopeMs = 100;

const renderJobs = new Map<string, RunInfo>();

async function performEvent(
  driver: Page,
  event: any,
  { browserZoom, render }: { browserZoom: number; render: boolean },
) {
  switch (event.type) {
    case "mousemove":
      await driver.mouse.move(event.x, event.y)
        .catch(() => {
          // ignore
        });
      break;
    case "mousedown":
      await driver.mouse
        .move(event.x, event.y);
      await driver.mouse.down();
      break;
    case "wheel":
      await driver.mouse
        .move(event.x, event.y);
      await driver.mouse.wheel({
        deltaX: event.payload?.deltaX * browserZoom,
        deltaY: event.payload?.deltaY * browserZoom,
      });
      break;
    case "mouseup":
      await driver.mouse
        .move(event.x, event.y);
      await driver.mouse.up();
      break;
    case "keydown":
      if (event.payload?.key) {
        await driver.keyboard.down(event.payload.key);
      }
      break;
    case "keyup":
      if (event.payload?.key) {
        await driver.keyboard.up(event.payload.key);
      }
      break;
  }
}

function zeroPad(num: number, places: number) {
  return String(num).padStart(places, "0");
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function interpolate(
  controlPoint1: UserInteraction,
  controlPoint2: UserInteraction,
  controlPoint3: UserInteraction,
  controlPoint4: UserInteraction,
  t: number,
) {
  return {
    x: controlPoint1.x * (1 - t) ** 3 +
      3 * controlPoint2.x * t * (1 - t) ** 2 +
      3 * controlPoint3.x * t ** 2 * (1 - t) +
      controlPoint4.x * t ** 3,
    y: controlPoint1.y * (1 - t) ** 3 +
      3 * controlPoint2.y * t * (1 - t) ** 2 +
      3 * controlPoint3.y * t ** 2 * (1 - t) +
      controlPoint4.y * t ** 3,
  };
}

function simplifyEvents(events: UserInteraction[]) {
  const result = [];

  let currentEventTypeStreak: string | undefined;
  let acc: UserInteraction | undefined;
  for (const event of events) {
    switch (event.type) {
      case "mousemove":
        if (currentEventTypeStreak === "mousemove") {
          acc = event;
        } else {
          if (acc) {
            result.push(acc);
          }
          acc = event;
          currentEventTypeStreak = "mousemove";
        }
        break;
      case "wheel":
        if (currentEventTypeStreak === "wheel") {
          acc = {
            ...acc!,
            payload: {
              deltaX: (acc!.payload as WheelEventPayload).deltaX +
                (event.payload as WheelEventPayload).deltaX,
              deltaY: (acc!.payload as WheelEventPayload).deltaY +
                (event.payload as WheelEventPayload).deltaY,
              deltaZ: (acc!.payload as WheelEventPayload).deltaZ +
                (event.payload as WheelEventPayload).deltaZ,
            },
          };
        } else {
          if (acc) {
            result.push(acc);
          }
          acc = event;
          currentEventTypeStreak = "wheel";
        }
        break;
      default:
        if (acc) {
          result.push(acc);
        }
        acc = undefined;
        currentEventTypeStreak = undefined;
        result.push(event);
    }
  }
  if (acc) {
    result.push(acc);
  }

  return result;
}

async function processEvents(
  runId: string,
  driver: Page,
  events: any[],
  { render, magnification = 1, headless }: {
    render: boolean;
    magnification?: number;
    headless: boolean;
  },
) {
  const frameCount = (events[events.length - 1].time - events[0].time) /
    (1000 / FRAMERATE);

  const status = {
    totalFrameCount: Math.floor(frameCount),
    frameIndex: 0,
    status: RunStatus.running,
  };
  renderJobs.set(runId, status);

  let totalEventsPerformed = 0;
  let currentTime = 0;
  let eventIndex = 0;
  const initialEvent = events[0];
  console.log("running");
  const startTime = Date.now();

  let currentEvent = events[eventIndex++];
  let previousPromise: Promise<unknown> = Promise.resolve();
  let lastRealFrame: number | undefined;
  let prevPrevMouseMoveEvent: UserInteraction | undefined;
  let prevMouseMoveEvent: UserInteraction | undefined;

  if (render) {
    await execAsync(`mkdir -p ./frames/${runId}`);
  }

  while (eventIndex < events.length) {
    if (status.status === RunStatus.cancelled) {
      break;
    } else if (status.status === RunStatus.paused) {
      await sleep(1000);
      continue;
    }
    let eventsPerformed = 0;
    let performedMouseMove = false;
    const eventsToPerform = [];
    while (
      currentEvent &&
      currentTime > currentEvent.time - initialEvent.time
    ) {
      eventsToPerform.push(currentEvent);
      currentEvent = events[eventIndex++];
    }

    let forceRenderUntil: number | undefined;
    for (const event of simplifyEvents(eventsToPerform)) {
      try {
        await performEvent(driver, event, {
          browserZoom: magnification,
          render,
        });
      } catch (e) {
        console.error("error performing event", e);
      }
      totalEventsPerformed++;
      eventsPerformed++;
      if (currentEvent?.type === "mousemove") {
        prevPrevMouseMoveEvent = prevMouseMoveEvent;
        prevMouseMoveEvent = currentEvent;
        performedMouseMove = true;
      } else if (currentEvent?.type === "mouseup") {
        forceRenderUntil = currentTime + clickEnvelopeMs;
      }
    }

    if (!performedMouseMove && prevMouseMoveEvent) {
      let nextMouseMoveEvent: UserInteraction | undefined;
      let nextNextMouseMoveEvent: UserInteraction | undefined;
      for (let i = eventIndex; i < events.length; i++) {
        if (events[i].type === "mousemove") {
          if (!nextMouseMoveEvent) {
            nextMouseMoveEvent = events[i];
            continue;
          } else {
            nextNextMouseMoveEvent = events[i];
            break;
          }
        }
      }
      if (nextMouseMoveEvent && interpolateMouseMove) {
        const firstControlPoint = prevPrevMouseMoveEvent ?? prevMouseMoveEvent;
        const lastControlPoint = nextNextMouseMoveEvent ?? nextMouseMoveEvent;
        const t = (currentTime - firstControlPoint.time) /
          (lastControlPoint.time - firstControlPoint.time);
        const interpolatedCoordinate = interpolate(
          prevPrevMouseMoveEvent ?? prevMouseMoveEvent,
          prevMouseMoveEvent,
          nextMouseMoveEvent,
          nextNextMouseMoveEvent ?? nextMouseMoveEvent,
          t,
        );
        performEvent(
          driver,
          {
            type: "mousemove",
            x: interpolatedCoordinate.x,
            y: interpolatedCoordinate.y,
          },
          { browserZoom: 2 * magnification, render },
        );
      }
    }
    if (eventsPerformed > 0 && events[eventIndex + 1] !== undefined) {
      if (!render) {
        driver.evaluate(updateDebugEventIndexDisplay(eventIndex));
      }
      console.log(
        "performed",
        eventsPerformed,
        "events",
        events.length - eventIndex,
        "remaining.",
        "current event index:",
        eventIndex,
        "next event in:",
        ((events[eventIndex + 1].time - currentTime) - initialEvent.time) /
          1000,
        "seconds",
      );
    }
    if (render) {
      lastRealFrame = status.frameIndex;
      if (
        eventsPerformed > 0 ||
        lastRealFrame === undefined ||
        !optimizeRender ||
        (forceRenderUntil !== undefined && forceRenderUntil > currentTime)
      ) {
        lastRealFrame = status.frameIndex;
        previousPromise = writeFile(
          `./frames/${runId}/${zeroPad(status.frameIndex++, 5)}.png`,
          await driver.screenshot(),
          "base64",
        );
      } else {
        // create a hard link to the previous frame
        const lastFrame = lastRealFrame!;
        const newFrame = status.frameIndex++;
        previousPromise.then(() =>
          execAsync(
            `ln -f ./frames/${runId}/${
              zeroPad(lastFrame, 5)
            }.png ./frames/${runId}/${
              zeroPad(
                newFrame,
                5,
              )
            }.png`,
          )
        );
      }
    } else {
      status.frameIndex++;
    }

    const timeStep = (1 / FRAMERATE) * 1000;
    if (!headless) {
      await sleep(timeStep);
      currentTime = Date.now() - startTime;
    } else {
      currentTime += timeStep;
    }

    if (forceRenderUntil !== undefined && currentTime > forceRenderUntil) {
      forceRenderUntil = undefined;
    }
  }
  status.status = RunStatus.finished;
  console.log("done! performed", totalEventsPerformed, "events");
}

const ZOOM_25_PERCENT = -7.6035680338478615;
const ZOOM_75_PERCENT = -1.5778829311823859;
const ZOOM_100_PERCENT = 0.0;
const ZOOM_150_PERCENT = 2.223901085741545;
const ZOOM_200_PERCENT = 3.8017840169239308;

const ZOOM_400_PERCENT = 7.6035680338478615;
const ZOOM_500_PERCENT = 8.827469119589406;

// if originalZoom is 100 and devicePixelRatio is 2, then we know that the "native" devicePixelRatio is 2.
// so the native device pixel ratio is devicePixelRatio / originalZoom.
// so for the equivalent zoom level, we need to divide the zoom level by the native device pixel ratio.
export function getZoomLevel(
  devicePixelRatio: number,
  magnification: number,
  originalZoom: number,
) {
  const sourceNativeDevicePixelRatio = devicePixelRatio / originalZoom;
  const sourceTargetDevicePixelRatioRatio = sourceNativeDevicePixelRatio /
    NATIVE_DEVICE_PIXEL_RATIO;

  const targetZoomLevel = (devicePixelRatio * magnification) /
    sourceTargetDevicePixelRatioRatio;
  switch (targetZoomLevel) {
    case 0.25:
      return ZOOM_25_PERCENT;
    case 0.75:
      return ZOOM_75_PERCENT;
    case 1:
      return ZOOM_100_PERCENT;
    case 1.5:
      return ZOOM_150_PERCENT;
    case 2:
      return ZOOM_200_PERCENT;
    case 2.5:
      return ZOOM_500_PERCENT;
    case 4:
      return ZOOM_400_PERCENT;
    case 5:
      return ZOOM_500_PERCENT;
    default:
      throw new Error(
        `invalid zoomLevel/magnification combo: ${devicePixelRatio} ${magnification}`,
      );
  }
}

export async function run(
  browser: Browser,
  runId: string,
  {
    events,
    renderFrames: render,
    headless,
    target,
    username,
    password,
    authTarget,
    magnification = 1,
    devicePixelRatio = 1,
    originalZoom = 1,
    resolution = { x: 2560, y: 1440 },
  }: RunRequest,
) {
  const page = await browser.newPage();

  await page.setViewport({
    width: render ? resolution.x * magnification : resolution.x,
    height: (render ? resolution.y * magnification : resolution.y),
  });

  await page.goto(target);

  await page.evaluate(
    `window.localStorage.removeItem('logged_in_user');
     window.localStorage.setItem('students_displayed_columns_v2', '["exam","exam_level","questions_answered","questions_correct","percent_correct", "average_response_time", "paid_account", "expiration_status"]');
     window.localStorage.setItem('userStats', '{ "startDate": "2025-01-01T05:00:00.000Z", "endDate": "2025-03-30T03:59:59.999Z" }');
    `,
  );

  await page.goto(target);

  if (username && password && authTarget) {
    const resp = await fetch(authTarget, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail: username,
        password,
        userAuthType: "basic",
      }),
    });

    if (resp.status !== 200) {
      throw new Error("auth failed");
    }

    const parsedResponse = await resp.json();

    await page.evaluate(
      `window.localStorage.setItem('logged_in_user', '${
        JSON.stringify(
          parsedResponse,
        )
      }');
       window.localStorage.setItem('students_displayed_columns', '["exam","examLevel","questionsAnswered","questionsCorrect","percentCorrect"]');
      `,
    );

    await page.goto(target);

    await sleep(1000);

    await page.goto(target);

    await page.evaluate(FALSE_CURSOR_CODE);
    if (!render) {
      await page.evaluate(initializeDebugEventIndexDisplay(0));
    }
  }

  await processEvents(runId, page, events, {
    render,
    magnification: render ? magnification : 1,
    headless,
  });

  page.close();
}

// const app = express();

// app.get("/ok", (_, res) => res.send("okso"));

// app.use(bodyParser.json({ limit: "5mb" }));

// // this is needed to accept form post requests.
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(fileUpload());
// app.use(cors());

// app.post("/run", (req, res) => {
//   const runId = Math.random().toString(36).substring(7);
//   run(runId, {
//     ...req.body,
//     render: req.body.render ?? false,
//   });
//   res.send({
//     runId,
//   });
// });

// app.post("/cancel", (req, res) => {
//   const job = renderJobs.get(req.body.runId);

//   if (job) {
//     job.status = RunStatus.cancelled;
//   }

//   res.send(job);
// });

// app.post("/pause", (req, res) => {
//   const job = renderJobs.get(req.body.runId);

//   if (job) {
//     job.status = RunStatus.paused;
//   }

//   res.send(job);
// });

// app.post("/play", (req, res) => {
//   const job = renderJobs.get(req.body.runId);

//   if (job) {
//     if (job.status === RunStatus.paused) {
//       job.status = RunStatus.running;
//     } else if (
//       job.status === RunStatus.cancelled ||
//       job.status === RunStatus.finished
//     ) {
//       res.sendStatus(400);
//       return;
//     }
//   }

//   res.send(job);
// });

// app.get("/status", (req, res) => {
//   const runId = (req.query as any)["runId"];

//   if (!runId) {
//     res.sendStatus(400);
//     return;
//   }
//   const job = renderJobs.get(runId);

//   if (!job) {
//     res.sendStatus(404);
//     return;
//   }

//   res.send(job);
// });

// app.listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });
