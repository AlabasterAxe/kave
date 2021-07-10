import { TimelineViewport } from "../../../common/model";

// this method assumes that the timeline will cover the whole viewport
// it emits a number that can be used in vws to position / size as element
export function scaleToScreen(viewport: TimelineViewport, timeSeconds: number) {
  return (
    (timeSeconds / (viewport.endTimeSeconds - viewport.startTimeSeconds)) * 100
  );
}

// this method assumes that the timeline will cover the whole viewport
// it emits a number that can be used in vws to position / size as element
export function transformToScreen(
  viewport: TimelineViewport,
  timeSeconds: number
) {
  return scaleToScreen(viewport, timeSeconds - viewport.startTimeSeconds);
}

export function transformToTimeline(
  viewport: TimelineViewport,
  screenFraction: number
) {
  return (
    viewport.startTimeSeconds +
    screenFraction * (viewport.endTimeSeconds - viewport.startTimeSeconds)
  );
}
