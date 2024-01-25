import { Project } from "kave-common";
import { ALL_PROJECTS } from "../store/project";

const PROJECTS_KEY = 'projects';

export function readLocalStoreProjects(): Project[] {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? JSON.stringify(ALL_PROJECTS)) as Project[];
}

export function writeLocalStoreProjects(project: Project[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(project));
}

export function upsertLocalStoreProject(project: Project): void {
    let projects = readLocalStoreProjects();
    if (projects.find(p => p.id === project.id)) {
      projects = projects.map(p => p.id === project.id ? project : p)
    } else {
        projects = [...projects, project];
    }
    writeLocalStoreProjects(projects); 
}