import { Project, User } from "@prisma/client";
import { UserOut, userListView, userView } from "./userView";
import { TaskIn, TaskOut, tasksListView } from "./taskView";


interface ProjectIn extends Project {
    owner?: User,
    members?: { user: User }[],
    tasks?: TaskIn[]
}

interface ProjectOut {
    id: number,
    name: string,
    description: string,
    owner?: UserOut,
    members?: UserOut[],
    tasks?: TaskOut[]
}

export function projectListView(projects: ProjectIn[]): ProjectOut[] {

    let accViews: ProjectOut[] = []

    for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        accViews.push(projectView(proj))
    }

    return accViews
}

export function projectView(project: ProjectIn): ProjectOut {
    let projView: ProjectOut = {
        id: project.id,
        name: project.name,
        description: project.description || ""
    }

    if (project.owner) {
        projView.owner = userView(project.owner)
    }

    if (project.members) {
        projView.members = userListView(project.members.map(m => m.user))
    }

    if (project.tasks) {
        projView.tasks = tasksListView(project.tasks)
    }

    return projView
}