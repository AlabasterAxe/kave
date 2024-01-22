import { FileType, Project, UserInteraction } from "kave-common";
import { useAppSelector } from "./store/hooks";
import { selectComposition, selectProject } from "./store/store";
import { getInteractionLogEventsForClip } from "./store/project";

function run(rqst: { events: any[]; render: boolean }) {
  
  fetch("http://localhost:20001/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rqst),
    });
}

function getInteractionLogForComposition(project: Project, compositionId: string): UserInteraction[] {
  const composition = project.compositions.find((c) => c.id === compositionId);
  
  if (!composition) {
    throw new Error(`Composition ${compositionId} not found`);
  }

  const events: UserInteraction[] = [];
  for (const clip of composition.clips) {
    events.push(...getInteractionLogEventsForClip(project, clip));
  }

  return events;
}

export function RenderPanel() {
  const project = useAppSelector(selectProject);
  const composition = useAppSelector(selectComposition);

  const render = () => {
    run({
      events: getInteractionLogForComposition(project, composition.id),
      render: true,
    });
  };

  const preview = () => {
    run({
      events: getInteractionLogForComposition(project, composition.id),
      render: false,
    });
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
