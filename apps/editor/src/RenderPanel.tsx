import {
  RunInfo,
  RunRequest,
  RunStatus,
  getInteractionLogEventsForComposition,
} from "kave-common";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { updateRenderSettings } from "./store/project";
import { selectActiveCompositionId, selectDocument } from "./store/store";

async function run(rqst: RunRequest) {
  const resp = await fetch("http://localhost:20001/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rqst),
  });

  return await resp.json();
}

export function RenderPanel() {
  const project = useAppSelector(selectDocument);
  const activeCompositionId = useAppSelector(selectActiveCompositionId);
  const dispatch = useAppDispatch();
  const [target, setTarget] = useState<string>(
    project?.renderSettings?.target ?? ""
  );
  const [username, setUsername] = useState<string>(
    project?.renderSettings?.username ?? ""
  );
  const [password, setPassword] = useState<string>(
    project?.renderSettings?.password ?? ""
  );
  const [authTarget, setAuthTarget] = useState<string>(
    project?.renderSettings?.authTarget ?? ""
  );
  const [magnification, setMagnification] = useState<number>(
    project?.renderSettings?.magnification ?? 1
  );
  const [originalZoom, setOriginalZoom] = useState<number>(
    project?.renderSettings?.originalZoom ?? 1
  );
  const [runId, setRunId] = useState<string | undefined>();
  const [runStatus, setRunStatus] = useState<RunInfo | undefined>();

  useEffect(() => {
    if (runId) {
      const interval = setInterval(async () => {
        const resp = await fetch(
          `http://localhost:20001/status?runId=${runId}`
        );
        const runInfo = await resp.json();
        if (runInfo.status === RunStatus.cancelled) {
          setRunId(undefined);
          setRunStatus(undefined);
        } else {
          setRunStatus(runInfo);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [runId]);

  useEffect(() => {
    if (project?.renderSettings?.target) {
      setTarget(project.renderSettings.target);
    }
  }, [project?.renderSettings?.target]);

  useEffect(() => {
    if (project?.renderSettings.username) {
      setUsername(project?.renderSettings.username);
    }
  }, [project?.renderSettings?.username]);

  useEffect(() => {
    if (project?.renderSettings?.password) {
      setPassword(project.renderSettings.password);
    }
  }, [project?.renderSettings?.password]);

  useEffect(() => {
    if (project?.renderSettings?.authTarget) {
      setAuthTarget(project.renderSettings.authTarget);
    }
  }, [project?.renderSettings?.authTarget]);

  useEffect(() => {
    if (project?.renderSettings?.magnification !== undefined) {
      setMagnification(project.renderSettings.magnification);
    }
  }, [project?.renderSettings?.magnification]);

  useEffect(() => {
    if (project?.renderSettings?.originalZoom !== undefined) {
      setOriginalZoom(project.renderSettings.originalZoom);
    }
  }, [project?.renderSettings?.originalZoom]);

  const render = async () => {
    if (activeCompositionId && project) {
      const {log, devicePixelRatio, resolution} = getInteractionLogEventsForComposition(
        project,
        activeCompositionId
      );
      const { runId } = await run({
        events: log,
        render: true,
        target,
        authTarget,
        username,
        password,
        magnification,
        devicePixelRatio,
        resolution,
      });
      setRunId(runId);
    }
  };

  const togglePlayback = async () => {
    if (runId && runStatus) {
      const resp = await fetch(
        `http://localhost:20001/${
          runStatus.status === RunStatus.running ? "pause" : "play"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ runId }),
        }
      );
      const runInfo = await resp.json();
      setRunStatus(runInfo);
    }
  };

  const dismiss = async () => {
    setRunId(undefined);
    setRunStatus(undefined);
  };

  const cancel = async () => {
    if (runId && runStatus) {
      const resp = await fetch(
        "http://localhost:20001/cancel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ runId }),
        }
      );
      const runInfo = await resp.json();
      setRunStatus(runInfo);
    }
    
  };

  const preview = async () => {
    if (activeCompositionId && project) {
      const {log, devicePixelRatio, resolution} = getInteractionLogEventsForComposition(
        project,
        activeCompositionId
      )
      const { runId } = await run({
        events: log,
        render: false,
        target,
        authTarget,
        username,
        password,
        devicePixelRatio,
        resolution,
      });
      setRunId(runId);
    }
  };

  return (
    <div className="h-96 w-96 bg-white border-2 border-black flex flex-col">
      <table className="w-full">
        <tr>
          <td className="font-bold">Target:</td>
          <td>
            <input
              className="border-2 border-black"
              name="target"
              value={target}
              onInput={(e) => {
                setTarget((e.target as HTMLInputElement).value);
              }}
              onChange={(e) => {
                dispatch(
                  updateRenderSettings({
                    target: (e.target as HTMLInputElement).value,
                  })
                );
              }}
            ></input>
          </td>
        </tr>
        <tr>
          <td className="font-bold">Auth Endpoint:</td>
          <td>
            <input
              className="border-2 border-black"
              name="authTarget"
              value={authTarget}
              onInput={(e) => {
                setAuthTarget((e.target as HTMLInputElement).value);
              }}
              onChange={(e) => {
                dispatch(
                  updateRenderSettings({
                    authTarget: (e.target as HTMLInputElement).value,
                  })
                );
              }}
            ></input>
          </td>
        </tr>
        <tr>
          <td className="font-bold">Username:</td>
          <td>
            <input
              className="border-2 border-black"
              value={username}
              onInput={(e) => {
                setUsername((e.target as HTMLInputElement).value);
              }}
              onChange={(e) => {
                dispatch(
                  updateRenderSettings({
                    username: (e.target as HTMLInputElement).value,
                  })
                );
              }}
            ></input>
          </td>
        </tr>
        <tr>
          <td className="font-bold">Password:</td>
          <td>
            <input
              className="border-2 border-black"
              type="password"
              value={password}
              onInput={(e) => {
                setPassword((e.target as HTMLInputElement).value);
              }}
              onChange={(e) => {
                dispatch(
                  updateRenderSettings({
                    password: (e.target as HTMLInputElement).value,
                  })
                );
              }}
            />
          </td>
        </tr>
        <tr>
          <td className="font-bold" title="This is the amount to magnify the recorded video.">Original Zoom:</td>
          <td>
            <select
              className="border-2 border-black"
              value={originalZoom}
              onInput={(e) => {
                setOriginalZoom(Number((e.target as HTMLSelectElement).value));
              }}
              onChange={(e) => {
                dispatch(
                  updateRenderSettings({
                    originalZoom: Number(
                      (e.target as HTMLSelectElement).value
                    ),
                  })
                );
              }}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
            </select>
          </td>
        </tr>
        <tr>
          <td className="font-bold" title="This is the amount to magnify the recorded video.">Magnification:</td>
          <td>
            <select
              className="border-2 border-black"
              value={magnification}
              onInput={(e) => {
                setMagnification(Number((e.target as HTMLSelectElement).value));
              }}
              onChange={(e) => {
                dispatch(
                  updateRenderSettings({
                    magnification: Number(
                      (e.target as HTMLSelectElement).value
                    ),
                  })
                );
              }}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="2.5">2.5x</option>
            </select>
          </td>
        </tr>
        
      </table>

      <div className="flex flex-row">
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
      {runStatus && (
        <div className="flex flex-row items-center">
          <progress
            className="flex-1"
            id="file"
            value={runStatus.frameIndex}
            max={runStatus.totalFrameCount}
          ></progress>
          {runStatus.status === RunStatus.finished ? (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
              onClick={dismiss}
            >
              Dismiss
            </button>
          ) : (
            <>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
                onClick={togglePlayback}
              >
                {runStatus.status === RunStatus.running ? "Pause" : "Continue"}
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
                onClick={cancel}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
