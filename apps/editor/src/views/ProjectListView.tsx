import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ALL_PROJECTS, blankProject } from "../store/project";
import { v4 as uuidv4 } from "uuid";
import { KaveDoc } from "kave-common";

const defaultProjects = ALL_PROJECTS;

export function ProjectListView() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();

  const onNewProjectClick = () => {
    const newProjectId = uuidv4();
    const localStorageProjects = JSON.parse(
      localStorage.getItem("projects") ?? JSON.stringify(defaultProjects)
    ) as KaveDoc[];
    localStorageProjects.push(blankProject(newProjectId));
    localStorage.setItem("projects", JSON.stringify(localStorageProjects));
    navigate(`/project/${newProjectId}`);
  };

  useEffect(() => {
    const localStorageProjects = JSON.parse(
      localStorage.getItem("projects") ?? JSON.stringify(defaultProjects)
    ) as { id: string; name: string }[];
    setProjects(localStorageProjects);
    localStorage.setItem("projects", JSON.stringify(localStorageProjects));
  }, [setProjects]);
  return (
    <div className="h-full w-full p-4">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold">Projects</h2>
        {projects.map((project) => (
          <NavLink key={project.id} to={`/project/${project.id}`}>
            {project.name}
          </NavLink>
        ))}
        <div onClick={onNewProjectClick}>New Project</div>
      </div>
    </div>
  );
}
