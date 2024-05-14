import { Tag, Task, User } from "@prisma/client";
import { UserOut, userView } from "./userView";
import { TagOut, tagView } from "./tagView";

export interface TaskIn extends Task {
  tags?: { tag: Tag }[];
  assignedMember?: User | null;
}

export interface TaskOut {
  id: number;
  title: string;
  description?: string;
  createdAt: Date;
  status: string;
  projectId: number;
  assignedMember?: UserOut | null;
  tags?: TagOut[];
}

export function tasksListView(tasks: Task[]): TaskOut[] {
  let accViews: TaskOut[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    accViews.push(taskView(task));
  }

  return accViews;
}

export function taskView(task: TaskIn): TaskOut {
  let taskView: TaskOut = {
    id: task.id,
    title: task.title,
    description: task.description || "",
    createdAt: task.createdAt,
    projectId: task.projectId,
    status: task.status
  };

  if (task.assignedMember) {
    taskView.assignedMember = userView(task.assignedMember);
  } else {
    taskView.assignedMember = null;
  }

  if (task.tags) {
    taskView.tags = task.tags.map((tagm) => tagView(tagm.tag));
  }

  return taskView;
}
