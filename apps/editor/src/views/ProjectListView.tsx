import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ALL_PROJECTS } from "../store/project";
import { v4 as uuidv4 } from "uuid";

const defaultProjects = ALL_PROJECTS.map(p => ({id: p.id, name: p.name}));

export function ProjectListView() {
    const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
    const navigate = useNavigate();

    const onNewProjectClick = () => {
        const newProjectId = uuidv4();
        const localStorageProjects = JSON.parse(localStorage.getItem("projects") ?? JSON.stringify(defaultProjects)) as {id: string, name: string}[];
        localStorageProjects.push({id: newProjectId, name: "Untitled Project"});
        localStorage.setItem("projects", JSON.stringify(localStorageProjects));
        navigate(`/project/${newProjectId}`);
    }

    useEffect(()=>{
        const localStorageProjects = JSON.parse(localStorage.getItem("projects") ?? JSON.stringify(defaultProjects)) as {id: string, name: string}[];
        setProjects(localStorageProjects);
        localStorage.setItem("projects", JSON.stringify(localStorageProjects));
    }, [setProjects])
    return <div className="flex flex-col">
        {(projects.map((project)=><NavLink key={project.id} to={`/project/${project.id}`}>{project.name}</NavLink>))}
        <div onClick={onNewProjectClick}>New Project</div>
        </div>
}