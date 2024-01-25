import { NavLink, useParams, useMatches } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectProjects } from "../store/store";
import { useState } from "react";
import { upsertProject } from "../store/project";

export function Header() {
    const [{params: {id}}] = useMatches();
    const projects = useAppSelector(selectProjects);
    const dispatch = useAppDispatch();
    const [newProjectName, setNewProjectName] = useState(id && projects[id] ? projects[id].name : "Untitled Project");
    const projectName = id && projects[id] ? projects[id].name : "Untitled Project";
    const [editingProjectName, setEditingProjectName] = useState(false);

    const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (id && e.key === "Enter") {
            e.preventDefault();
            setEditingProjectName(false);
            dispatch(upsertProject({id, name: newProjectName}));
        }
    }

    return <div className="h-16 w-screen py-2 px-4 items-center flex flex-row border-b">
      <NavLink to="/" className="text-xl font-bold">Kave</NavLink>{id && projectName && <><span>&nbsp;-&nbsp;</span>
      <span 
        contentEditable={editingProjectName}
        onDoubleClick={()=>{
          setEditingProjectName(true);
        }}
        onBlur={()=>{
          dispatch(upsertProject({id, name: newProjectName}));
          setEditingProjectName(false);
        }}
        onKeyDown={onKeyDown}
        onInput={(e)=>{
          setNewProjectName(e.currentTarget.innerText);
        }}
        >{projectName}</span></>}
    </div>
}