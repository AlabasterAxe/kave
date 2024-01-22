import { FileType } from "kave-common";
import { useAppSelector } from "./store/hooks";
import { selectProject } from "./store/store";

export function RenderPanel() {
  const project = useAppSelector(selectProject);

  const render = () => {
    const interactionLogFile = project.files.find(
      (f) => f.type === FileType.interaction_log
    );
    fetch("http://localhost:20001/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events: interactionLogFile?.userInteractionLog?.log,
      }),
    });
  };

  return (
    <div className="h-96 w-96 bg-white border-2 border-black">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
        onClick={render}
      >
        Render
      </button>
    </div>
  );
}
