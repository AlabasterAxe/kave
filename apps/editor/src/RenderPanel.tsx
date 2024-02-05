import { RunRequest, getInteractionLogEventsForComposition } from "kave-common";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { updateRenderSettings } from "./store/project";
import { selectActiveCompositionId, selectDocument } from "./store/store";

function run(rqst: RunRequest) {
  fetch("http://localhost:20001/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rqst),
  });
}

export function RenderPanel() {
  const project = useAppSelector(selectDocument);
  const activeCompositionId = useAppSelector(selectActiveCompositionId);
  const dispatch = useAppDispatch();
  const [target, setTarget] = useState<string>(project?.renderSettings?.target ?? "");
  const [username, setUsername] = useState<string>(project?.renderSettings?.username ?? "");
  const [password, setPassword] = useState<string>(project?.renderSettings?.password ?? "");
  const [authTarget, setAuthTarget] = useState<string>(project?.renderSettings?.authTarget ?? "");
  const [magnification, setMagnification] = useState<number>(project?.renderSettings?.magnification ?? 1);

  useEffect(()=>{
    if (project?.renderSettings?.target) {
      setTarget(project.renderSettings.target);
    }
  }, [
    project?.renderSettings?.target,
  ])

  useEffect(()=>{
    if (project?.renderSettings.username) {
      setUsername(project?.renderSettings.username);
    }
  }, [
    project?.renderSettings?.username,
  ])

  useEffect(()=>{
    if (project?.renderSettings?.password) {
      setPassword(project.renderSettings.password);
    }
  }, [
    project?.renderSettings?.password,
  ])

  useEffect(()=>{
    if (project?.renderSettings?.authTarget) {
      setAuthTarget(project.renderSettings.authTarget);
    }
  }, [
    project?.renderSettings?.authTarget,
  ])

  const render = () => {
    if (activeCompositionId && project) {
      run({
        events: getInteractionLogEventsForComposition(project, activeCompositionId),
        render: true,
        target,
        authTarget,
        username,
        password,
        magnification,
      });
    }
  };

  const preview = () => {
    if (activeCompositionId && project) {
      run({
        events: getInteractionLogEventsForComposition(project, activeCompositionId),
        render: false,
        target,
        authTarget,
        username,
        password,
      });
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
                dispatch(updateRenderSettings(
                  {target: (e.target as HTMLInputElement).value,}
                ))
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
                dispatch(updateRenderSettings(
                  {authTarget: (e.target as HTMLInputElement).value,}
                ))
              }}
            ></input>
          </td>
        </tr>
        <tr>
          <td className="font-bold">Username:</td>
          <td><input
              className="border-2 border-black"
              value={username}
          onInput={(e) => {
            setUsername((e.target as HTMLInputElement).value);
          }}
          onChange={(e) => {
            dispatch(updateRenderSettings(
              {username: (e.target as HTMLInputElement).value,}
            ))
          }}
        ></input></td>
      
        </tr>
        <tr>
          <td className="font-bold">Password:</td>
          <td><input
          className="border-2 border-black"
          type="password"
          value={password}
          onInput={(e) => {
            setPassword((e.target as HTMLInputElement).value);
          }}
          onChange={(e) => {
            dispatch(updateRenderSettings(
              {password: (e.target as HTMLInputElement).value,}
            ))
          }}
           /></td>
        </tr>
        <tr>
          <td className="font-bold">Magnification:</td>
          <td><select
          className="border-2 border-black"
          value={magnification}
          onInput={(e) => {
            setMagnification(Number((e.target as HTMLSelectElement).value));
          }}
          onChange={(e) => {
            dispatch(updateRenderSettings(
              {magnification: Number((e.target as HTMLSelectElement).value)}
            ));
          }}
           >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="2.5">2.5x</option>
            </select></td>
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
    </div>
  );
}
