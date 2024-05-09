import express, { Router, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import newTaskSchema from "../validation/tasks/newTaskSchema";
import { taskView, tasksListView } from "../views/taskView";
import updateTaskSchema from "../validation/tasks/updateTaskSchema";
import deleteTaskSchema from "../validation/tasks/deleteTaskSchema";
import listTasksIn from "../validation/tasks/listTaskSchema";
import { isOwnerOrMember } from "../services/projectService";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask
} from "../services/taskService";
import getTaskSchema from "../validation/tasks/getTaskSchema";

const controller: Router = express.Router();
const route = "/projects";

controller.use(authenticateToken);

controller.post(
  "/:projectId/tasks/",
  checkSchema(newTaskSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = Number.parseInt(req.claims.userId);
    const projectId = Number.parseInt(req.params.projectId);

    try {
      // Not members or owners cannot create tasks
      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException("Not owner or member of project!", 403);

      let { title, description, assignedMemberId, tags } = req.body;

      if (assignedMemberId) {
        assignedMemberId = Number.parseInt(assignedMemberId);
      }

      const taskModel = await createTask(
        projectId,
        title,
        description,
        assignedMemberId,
        tags
      );

      res.status(200).json(taskView(taskModel));
      next()
    } catch (error) {
      next(error);
    }
  }
);

controller.put(
  "/:projectId/tasks/:taskId",
  checkSchema(updateTaskSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException("Not owner or member of project!", 403);

      const taskId = Number.parseInt(req.params.taskId);

      const task = await getTask(taskId);

      if (!task) throw new ResponseException("Task not found!", 404)

      const { title, description, assignedMemberId, status } = req.body;

      const updatedTask = await updateTask(
        projectId,
        taskId,
        title,
        description,
        assignedMemberId,
        status
      );

      res.status(200).send(taskView(updatedTask));
      next()
    } catch (error) {
      return next(error);
    }
  }
);

controller.get(
  "/:projectId/tasks/:taskId",
  checkSchema(getTaskSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException(
          "Only members or the owner of this project can access tasks!",
          403
        );

      const taskId = Number.parseInt(req.params.taskId);

      const task = await getTask(taskId);

      if (!task) throw new ResponseException("Task not found!", 404)

      res.status(200).json(taskView(task));
      next()
    } catch (error) {
      next(error);
    }
  }
)

controller.delete(
  "/:projectId/tasks/:taskId",
  checkSchema(deleteTaskSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException(
          "Only members or the owner of this project can remove tasks!",
          403
        );

      const taskId = Number.parseInt(req.params.taskId);

      const task = await getTask(taskId);

      if (!task) throw new ResponseException("Task not found!", 404)

      await deleteTask(taskId);

      res.status(200).json({
        ok: "Deleted task!"
      });
      next()
    } catch (error) {
      next(error);
    }
  }
);

controller.get(
  "/:projectId/tasks/",
  checkSchema(listTasksIn),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      // To see task list you need to be the owner or the member
      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException("Not owner or member of project!", 403);

      const { status, tags } = req.query;

      const tasks = await listTasks(
        status as string | string[] | undefined,
        tags as string | string[] | undefined
      );

      res.status(200).send(tasksListView(tasks));
      next()
    } catch (error) {
      next(error);
    }
  }
);

export default { controller, route } as Controller;
