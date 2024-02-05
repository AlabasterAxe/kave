import { FileType, KaveDoc } from "./model";
import {
  getInteractionLogEventsForClip,
  getInteractionLogEventsForComposition,
} from "./queries";

function getDummyDoc(): KaveDoc {
  const dummyDoc: KaveDoc = {
    id: "blah",
    name: "Blah",
    files: [
      {
        id: "interaction-log-1",
        type: FileType.interaction_log,
        userInteractionLog: {
          log: [
            {
              type: "mousemove",
              time: 1000,
              x: 0,
              y: 0,
            },
            {
              type: "mousemove",
              time: 3500,
              x: 1,
              y: 2,
            },
            {
              type: "mousemove",
              time: 5500,
              x: 3,
              y: 4,
            },
          ],
        },
      },
    ],
    sequences: [
      {
        id: "sequence-1",
        tracks: [
          {
            id: "track-1",
            fileId: "interaction-log-1",
            alignmentSeconds: -1,
          },
        ],
      },
    ],
    compositions: [
      {
        id: "composition-1",
        clips: [
          {
            id: "clip-1",
            durationSeconds: 1,
            sourceId: "sequence-1",
            sourceOffsetSeconds: 1,
          },
          {
            id: "clip-2",
            durationSeconds: 1,
            sourceId: "sequence-1",
            sourceOffsetSeconds: 3,
          },
        ],
        resolution: {
          x: 1920,
          y: 1080,
        },
      },
    ],
    renderSettings: {
      target: "",
      authTarget: "",
      username: "",
      password: "",
      magnification: 0,
    },
  };
  return dummyDoc;
}

describe("project", () => {
  it("should return the right events for a clip", () => {
    const doc = getDummyDoc();
    const clip = doc.compositions[0].clips[0];
    const log = getInteractionLogEventsForClip(doc, clip) ?? {};
    expect(log).toMatchInlineSnapshot(`
      [
        {
          "time": 500,
          "type": "mousemove",
          "x": 1,
          "y": 2,
        },
      ]
    `);
  });

  it("should return the right events for the composition", () => {
    const doc = getDummyDoc();
    const compositionId = doc.compositions[0].id;
    const log = getInteractionLogEventsForComposition(doc, compositionId) ?? {};
    expect(log).toMatchInlineSnapshot(`
      [
        {
          "time": 500,
          "type": "mousemove",
          "x": 1,
          "y": 2,
        },
        {
          "time": 1500,
          "type": "mousemove",
          "x": 3,
          "y": 4,
        },
      ]
    `);
  });
});
