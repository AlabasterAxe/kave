import { KaveDoc, UserInteraction } from "../../../lib/common/dist";
import { useAppSelector } from "./store/hooks";
import { getInteractionLogEventsForClip } from "./store/project";
import { selectActiveCompositionId, selectDocument } from "./store/store";

function run(rqst: { events: any[]; render: boolean }) {
  
  fetch("http://localhost:20001/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rqst),
    });
}

function getInteractionLogForComposition(project: KaveDoc, compositionId: string): UserInteraction[] {
  const composition = project.compositions.find((c) => c.id === compositionId);
  
  if (!composition) {
    throw new Error(`Composition ${compositionId} not found`);
  }

  const events: UserInteraction[] = [];
  for (const clip of composition.clips) {
    events.push(...(getInteractionLogEventsForClip(project, clip)?.log ?? []));
  }

  return events;
}

export function RenderPanel() {
  const project = useAppSelector(selectDocument);
  const activeCompositionId = useAppSelector(selectActiveCompositionId);

  const render = () => {
    if (activeCompositionId && project) {
      run({
        events: getInteractionLogForComposition(project, activeCompositionId),
        render: true,
      });
    }
  };

  const preview = () => {
    if (activeCompositionId && project) {
    run({
      events: getInteractionLogForComposition(project, activeCompositionId),
      render: false,
    });
    }
  }

  return (
    <div className="h-96 w-96 bg-white border-2 border-black">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
        onClick={render}
      >
        Render
      </button>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
        onClick={preview}
      >
       Preview 
      </button>
    </div>
  );
}
