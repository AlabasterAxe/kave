import { Builder, By, Key, WebDriver, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import { writeFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import express from "express";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import cors from "cors";
import { RunRequest, UserInteraction, WheelEventPayload } from "kave-common";
import "isomorphic-fetch";
import { FALSE_CURSOR_CODE } from "./false-cursor";

const execAsync = promisify(exec);

const FRAMERATE = 30;
const port = process.env.PORT || 20001;
const optimizeRender = true;
const interpolateMouseMove = true;

function getKey(key: string): any {
  switch (key) {
    case "Shift":
      return Key.SHIFT;
    case "Control":
      return Key.CONTROL;
    case "Alt":
      return Key.ALT;
    case "Meta":
      return Key.META;
    case "Enter":
      return Key.ENTER;
    case "Backspace":
      return Key.BACK_SPACE;
    case "Tab":
      return Key.TAB;
    case "ArrowLeft":
      return Key.ARROW_LEFT;
    case "ArrowRight":
      return Key.ARROW_RIGHT;
    case "ArrowUp":
      return Key.ARROW_UP;
    case "ArrowDown":
      return Key.ARROW_DOWN;
    default:
      return key;
  }
}

async function performEvent(driver: WebDriver, event: any, {browserZoom}: {browserZoom: number}) {
  switch (event.type) {
    case "mousemove":
      await driver
        .actions()
        .move({ x: event.x, y: event.y, duration: 1 })
        .perform()
        .catch(() => {
          // ignore
        });
      break;
    case "mousedown":
      await driver
        .actions()
        .move({ x: event.x, y: event.y, duration: 1 })
        .press()
        .perform()
        .catch(() => {});
      break;
    case "wheel":
        await (driver
          .actions() as any)
          .scroll(0, 0, Math.round(event.payload.deltaX * browserZoom), Math.round(event.payload.deltaY * browserZoom))
          .perform()
          .catch((e: any) => {
            console.log("bad?", e);
          });
        break;
    case "mouseup":
      await driver
        .actions()
        .move({ x: event.x, y: event.y, duration: 1 })
        .release()
        .perform()
        .catch(() => {});
      break;
    case "keydown":
      if (event.payload?.key) {
        await driver
          .actions()
          .keyDown(getKey(event.payload.key))
          .perform()
          .catch(() => {});
      }
      break;
    case "keyup":
      if (event.payload?.key) {
        await driver
          .actions()
          .keyUp(getKey(event.payload.key))
          .perform()
          .catch(() => {});
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

function interpolate(controlPoint1: UserInteraction, controlPoint2: UserInteraction, controlPoint3: UserInteraction, controlPoint4: UserInteraction, t: number) {
  return {
    x: controlPoint1.x * (1 - t) ** 3 + 3 * controlPoint2.x * t * (1 - t) ** 2 + 3 * controlPoint3.x * t ** 2 * (1 - t) + controlPoint4.x * t ** 3,
    y: controlPoint1.y * (1 - t) ** 3 + 3 * controlPoint2.y * t * (1 - t) ** 2 + 3 * controlPoint3.y * t ** 2 * (1 - t) + controlPoint4.y * t ** 3
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
          acc = { ...acc!, payload: { deltaX: (acc!.payload as WheelEventPayload).deltaX + (event.payload as WheelEventPayload).deltaX, deltaY: (acc!.payload as WheelEventPayload).deltaY + (event.payload as WheelEventPayload).deltaY, deltaZ: (acc!.payload as WheelEventPayload).deltaZ + (event.payload as WheelEventPayload).deltaZ } };
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
  driver: WebDriver,
  events: any[],
  { render, magnification = 1 }: { render: boolean, magnification?: number }
) {
  let totalEventsPerformed = 0;
  let currentTime = 0;
  let eventIndex = 0;
  let frameIndex = 0;
  const initialEvent = events[0];
  console.log("running");
  const startTime = Date.now();

  let currentEvent = events[eventIndex++];
  let previousPromise: Promise<unknown> = Promise.resolve();
  let lastRealFrame: number | undefined;
  let prevPrevMouseMoveEvent: UserInteraction | undefined;
  let prevMouseMoveEvent: UserInteraction | undefined;

  if (render) {
    await execAsync('rm -rf ./frames');
    await execAsync('mkdir ./frames');
  }

  while (eventIndex < events.length) {
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

    for (const event of simplifyEvents(eventsToPerform)) {
      await performEvent(driver, event, {browserZoom: 2 * magnification});
      totalEventsPerformed++;
      eventsPerformed++;
      if (currentEvent?.type === "mousemove") {
        prevPrevMouseMoveEvent = prevMouseMoveEvent;
        prevMouseMoveEvent = currentEvent;
        performedMouseMove = true;
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
        const t = (currentTime - firstControlPoint.time) / (lastControlPoint.time - firstControlPoint.time);
        const interpolatedCoordinate = interpolate(prevPrevMouseMoveEvent ?? prevMouseMoveEvent, prevMouseMoveEvent, nextMouseMoveEvent, nextNextMouseMoveEvent ?? nextMouseMoveEvent, t);
        performEvent(driver, { type: "mousemove", x: interpolatedCoordinate.x, y: interpolatedCoordinate.y }, {browserZoom: 2 * magnification});
      }
      
    }
    if (eventsPerformed > 0) {
      console.log("performed", eventsPerformed, "events");
    }
    if (render) {
      if (eventsPerformed > 0 || lastRealFrame === undefined || !optimizeRender) {
        lastRealFrame = frameIndex;
        previousPromise = writeFile(
          `./frames/${zeroPad(frameIndex++, 5)}.png`,
          await driver.takeScreenshot(),
          "base64"
        );
      } else {
        // create a hard link to the previous frame
        const lastFrame = lastRealFrame!;
        const newFrame = frameIndex++;
        previousPromise.then(() =>
          execAsync(
            `ln -f ./frames/${zeroPad(lastFrame, 5)}.png ./frames/${zeroPad(newFrame, 5)}.png`
          )
        );
      }
    }

    const timeStep = (1 / FRAMERATE) * 1000;
    if (!render) {
      await sleep(timeStep);
      currentTime = Date.now() - startTime;
    } else {
      currentTime += timeStep;
    }
    console.log(currentTime);
  }
  console.log("done! performed", totalEventsPerformed, "events");
}

const ZOOM_25_PERCENT = -7.6035680338478615;
const ZOOM_75_PERCENT = -1.5778829311823859;
const ZOOM_100_PERCENT = 0.0;
const ZOOM_150_PERCENT = 2.223901085741545;
const ZOOM_200_PERCENT = 3.8017840169239308;

const ZOOM_400_PERCENT = 7.6035680338478615;
const ZOOM_500_PERCENT = 8.827469119589406;

async function run({
  events,
  render,
  target,
  username,
  password,
  authTarget,
  magnification=1,
}: RunRequest) {
  const opts = new Options();
  if (render) {
    opts.addArguments("--headless=new");
  }
  opts.windowSize({
    width: render ? 2560 * magnification : 2560,
    height: (render ? 1440 * magnification : 1440) + 85,
  });
  opts.setUserPreferences({
    partition: {
      default_zoom_level: {
        x: render ? ZOOM_200_PERCENT * magnification : ZOOM_200_PERCENT,
      },
    },
  });
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(opts)
    .build();

  await driver.get(target);

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

    await driver.executeScript(
      `window.localStorage.setItem('logged_in_user', '${JSON.stringify(parsedResponse)}');
       window.localStorage.setItem('students_displayed_columns', '["exam","examLevel","questionsAnswered","questionsCorrect","percentCorrect"]');
      `
    );

    await driver.get(target);

    await driver.sleep(1000);

    await driver.executeScript(FALSE_CURSOR_CODE);
  }

  await processEvents(driver, events, { render, magnification });

  await driver.sleep(100_000);

  driver.quit();
}

const app = express();

app.get("/ok", (_, res) => res.send("okso"));

app.use(bodyParser.json({ limit: "5mb" }));

// this is needed to accept form post requests.
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());
app.use(cors());

app.post("/run", (req, res) => {
  run({
    ...req.body,
    render: req.body.render ?? false,
  });
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
