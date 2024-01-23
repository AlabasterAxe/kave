import { Builder, By, Key, WebDriver, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import {writeFile} from "fs";
import express from "express";
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import cors from 'cors';

const FRAMERATE = 30;
const port = process.env.PORT || 20001;


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
    default:
      return key;
  }
}

async function performEvent(driver: WebDriver, event: any) {

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
    // case "click":
    //   await driver
    //     .actions()
    //     .move({ x: event.x, y: event.y, duration: 1 })
    //     .click() 
    //     .perform()
    //     .catch(() => {});
    //   break;
    case "mousedown":
      await driver
        .actions()
        .move({ x: event.x, y: event.y, duration: 1 })
        .press() 
        .perform()
        .catch(() => {});
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

async function processEvents(
  driver: WebDriver,
  events: any[],
  {render}: {render: boolean},
) {
  let totalEventsPerformed = 0;
  let currentTime = 0;
  let eventIndex = 0;
  let frameIndex = 0;
  const initialEvent = events[0];
  console.log("running");
  const startTime = Date.now();

  let currentEvent = events[eventIndex++];
  while (eventIndex < events.length) {
    let eventsPerformed = 0;
    while (currentEvent && currentTime > (currentEvent.time - initialEvent.time)) {
      await performEvent(driver, currentEvent);
      totalEventsPerformed++;
      eventsPerformed++;
      currentEvent = events[eventIndex++];
    }
    if (eventsPerformed > 0) {
      console.log("performed", eventsPerformed, "events");
    }
    if (render && eventsPerformed > 0) {
      writeFile(`./frames/${zeroPad(frameIndex++, 5)}.png`, await driver.takeScreenshot(), 'base64', () => {});
    } else {
      frameIndex++;
    }
    
    const timeStep = 1/FRAMERATE * 1000;
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
const ZOOM_600_PERCENT = ZOOM_200_PERCENT * 3;

async function run({events, render}: RunRequest) {
  const opts = new Options();
  if (render) {
    opts.addArguments('--headless=new');
  }
  opts.windowSize({
    width: render ? 2560 * 3 : 2560,
    height: render ? 1440 * 3 : 1440,
  });
  opts.setUserPreferences({
    partition: {
      default_zoom_level: {
        x: render ? ZOOM_500_PERCENT : ZOOM_150_PERCENT,
      },
    },
  });
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(opts)
    .build();
  await driver.get("http://localhost:52222/");

  await driver.sleep(5000);
  await driver.executeScript('enableSimulatedCursor();');

  await processEvents(driver, events, {render});

  driver.quit();
};

const app = express();

app.get('/ok', (_, res) => res.send('okso'));

app.use(bodyParser.json({ limit: '5mb' }));

// this is needed to accept form post requests.
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());
app.use(cors());


interface RunRequest {
  events: any[];
  render: boolean;
}

app.post('/run', (req, res) => {
  run({events: req.body.events, render: req.body.render ?? false,});
  res.sendStatus(200);
});

app.listen(port, ()=>{
  console.log(`Listening on port ${port}`);
});