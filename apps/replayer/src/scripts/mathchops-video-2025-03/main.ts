import { getZoomLevel, run } from "../..";
import * as events_1 from "./events/events_1.json";
import * as events_2 from "./events/events_2.json";
import * as events_3 from "./events/events_3_fixed.json";
import * as example from "./events/example.json";
import prompt from "prompt-sync";
import UserPrefsPlugin from "puppeteer-extra-plugin-user-preferences";
import puppeteer from "puppeteer-extra";

prompt()("Reset the user");

const runId = new Date().toISOString();

async function doRuns() {
    const headless = true;
    const render = true;
    const resolution = { x: 1446, y: 813 };
    const magnification = 2;
    const devicePixelRatio = 2;
    const originalZoom = 1;

    puppeteer.use(UserPrefsPlugin({
        userPrefs: {
            partition: {
                default_zoom_level: {
                    x: render
                        ? getZoomLevel(
                            devicePixelRatio,
                            magnification,
                            originalZoom,
                        )
                        : getZoomLevel(devicePixelRatio, 1, originalZoom),
                },
            },
        },
    }));

    const tutorBrowser = await puppeteer.launch({
        headless,
        args: [
            `--window-size=${
                render ? resolution.x * magnification : resolution.x
            },${render ? resolution.y * magnification : resolution.y}`,
        ],
    });
    const studentBrowser = await puppeteer.launch({
        headless,
        args: [
            `--window-size=${
                render ? resolution.x * magnification : resolution.x
            },${render ? resolution.y * magnification : resolution.y}`,
        ],
    });

    // const tutor1RunId = `${runId}-part1-tutor`;
    // await run(
    //     tutorBrowser,
    //     tutor1RunId,
    //     {
    //         events: events_1.log as any,
    //         renderFrames: render,
    //         headless,
    //         target: "https://weekly.mathchops.com",
    //         username: "mike.mcgibbon+tutordemo1@gmail.com",
    //         password: "asdfasdf1",
    //         magnification,
    //         devicePixelRatio,
    //         resolution,
    //         authTarget: "https://weeklyapi.mathchops.com/api/login",
    //     },
    // );
    // const studentRunId = `${runId}-part2-student`;
    // await run(
    //     studentBrowser,
    //     studentRunId,
    //     {
    //         events: events_2.log as any,
    //         renderFrames: render,
    //         headless,
    //         target: "https://weekly.mathchops.com",
    //         username: "woodland73@example.com",
    //         password: "quadratic10",
    //         magnification,
    //         devicePixelRatio,
    //         resolution,
    //         authTarget: "https://weeklyapi.mathchops.com/api/login",
    //     },
    // );
    const tutor2RunId = `${runId}-part3-tutor`;
    await run(
        tutorBrowser,
        tutor2RunId,
        {
            events: events_3.log as any,
            renderFrames: render,
            headless,
            target: "http://localhost:4200/",
            username: "mike.mcgibbon+tutordemo1@gmail.com",
            password: "asdfasdf1",
            magnification,
            devicePixelRatio,
            resolution,
            authTarget: "https://weeklyapi.mathchops.com/api/login",
        },
    );

    await tutorBrowser.close();
    await studentBrowser.close();
}

doRuns().then(() => {
    console.log("done");
});

// run(
//     runId,
//     {
//         events: example.log as any,
//         render: false,
//         target: "https://weekly.mathchops.com",
//         username: "matthew.ed.keller+tutor@gmail.com",
//         password: "asdfasdf1",
//         magnification: 1,
//         devicePixelRatio: 2,
//         resolution: { x: 1446, y: 813 },
//         authTarget: "https://weeklyapi.mathchops.com/api/login",
//     },
// ).then(() => {
//     console.log("done");
// });
