import { Task } from "@prisma/client";
import prisma from "../db/prismaClient";
import { ResponseException } from "../errors/ResponseException";
import { isOwnerOrMember } from "./projectService";

export async function createTask(
  projectId: number,
  title: string,
  description?: string,
  assignedMemberId?: number,
  tags?: string[]
): Promise<Task> {
  let newTaskData: any = {
    projectId: projectId,
    title: title
  };

  if (description) {
    newTaskData.description = description;
  }

  if (assignedMemberId) {
    // Check if its the owner or member assigned
    if (!(await isOwnerOrMember(projectId, assignedMemberId)))
      throw new ResponseException(
        "Assigned member not owner or member of project!",
        403
      );

    newTaskData.assignedMemberId = assignedMemberId;
  }

  if (tags && tags.length > 0) {
    newTaskData.tags = {
      create: []
    };

    let accTags = [];

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];

      accTags.push({
        tag: {
          create: {
            title: tag
          }
        }
      });
    }

    newTaskData.tags.create = accTags;
  }

  const taskModel = await prisma.task.create({
    data: newTaskData,
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      assignedMember: true
    }
  });

  return taskModel;
}

export async function updateTask(
  taskId: number,
  projectId: number,
  title?: string,
  description?: string,
  assignedMemberId?: number,
  tags?: string[]
): Promise<Task> {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId
    }
  });

  if (!task) throw new ResponseException("Task not found!", 404);

  if (task.status === "done")
    throw new ResponseException("Cannot edit done tasks!", 401);

  let updateData: any = {};

  if (assignedMemberId) {
    if (!(await isOwnerOrMember(assignedMemberId, projectId)))
      throw new ResponseException(
        "Only members or the owner of this project can be assigned tasks!",
        401
      );

    updateData.assignedMemberId = assignedMemberId;
  }

  if (title) {
    updateData.title = title;
  }

  if (description) {
    updateData.description = description;
  }

  if (status) {
    updateData.status = status;
  }

  if (Object.keys(updateData).length > 0) {
    return await prisma.task.update({
      where: {
        id: taskId
      },
      data: updateData
    });
  } else {
    throw new ResponseException("No update data provided!", 400);
  }
}

export async function deleteTask(taskId: number): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId
    }
  });

  if (!task) throw new ResponseException("Task not found!", 404);

  if (task.status === "done")
    throw new ResponseException("Cannot edit done tasks!", 401);

  await prisma.task.delete({
    where: {
      id: taskId
    }
  });

  return true;
}

export async function getTask(taskId: number): Promise<Task | null> {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId
    }
  });

  return task;
}

export async function listTasks(
  status?: string[] | string,
  tags?: string[] | string
): Promise<Task[]> {
  let statusFilters: any = {};

  if (status) {
    if (status instanceof Array) {
      let orAcc = [];

      for (let i = 0; i < status.length; i++) {
        const filterValue = status[i];

        orAcc.push({
          status: filterValue
        });
      }

      statusFilters.OR = orAcc;
    } else {
      statusFilters.status = status;
    }
  }

  let tagFilters: any = {};
  if (tags) {
    if (tags instanceof Array) {
      let orAcc = [];

      for (let i = 0; i < tags.length; i++) {
        const filterValue = tags[i];

        orAcc.push({
          tags: {
            some: {
              tag: {
                title: {
                  contains: filterValue
                }
              }
            }
          }
        });
      }

      tagFilters.OR = orAcc;
    } else {
      tagFilters.tags = {
        some: {
          tag: {
            title: {
              contains: tags
            }
          }
        }
      };
    }
  }

  let filters: any = {};

  if (
    Object.keys(statusFilters).length > 0 &&
    Object.keys(tagFilters).length > 0
  ) {
    filters.AND = [statusFilters, tagFilters];
  } else if (Object.keys(statusFilters).length > 0) {
    filters = statusFilters;
  } else if (Object.keys(tagFilters).length > 0) {
    filters = tagFilters;
  }

  const tasks = await prisma.task.findMany({
    include: {
      assignedMember: true,
      tags: {
        select: {
          tag: true
        }
      }
    },
    where: filters
  });

  return tasks;
}

export async function hasTag(taskId: number, tagId: number): Promise<Boolean> {
  const task = prisma.task.findUnique({
    where: {
      id: taskId,
      tags: {
        some: {
          tagId: tagId
        }
      }
    }
  });

  return task !== null;
}
