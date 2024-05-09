import express, { Router, Response, NextFunction } from "express";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import { isOwnerOrMember } from "../services/projectService";
import { getTask, hasTag } from "../services/taskService";
import newTagSchema from "../validation/tags/newTagSchema";
import {
  createTag,
  deleteTag,
  listTags,
  updateTag
} from "../services/tagService";
import listTagsSchema from "../validation/tags/listTagsSchema";
import deleteTagSchema from "../validation/tags/deleteTagSchema";
import updateTagSchema from "../validation/tags/updateTagSchema";

const controller: Router = express.Router();
const route = "/projects";

controller.use(authenticateToken);

controller.post(
  "/:projectId/tasks/:taskId/tags/",
  checkSchema(newTagSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = Number.parseInt(req.claims.userId);
    const projectId = Number.parseInt(req.params.projectId);

    try {
      // Only members or owners can create tasks
      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException("Not owner or member of project!", 403);

      const taskId = Number.parseInt(req.params.taskId);

      const task = await getTask(taskId);

      if (!task) throw new ResponseException("Task not found!", 404);

      const { title } = req.body;

      const tag = await createTag(taskId, title);

      res.status(201).json(tag);
      next()
    } catch (error) {
      next(error);
    }
  }
);

controller.put(
  "/:projectId/tasks/:taskId/tags/:tagId",
  checkSchema(updateTagSchema),
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

      if (!task || task.projectId !== projectId)
        throw new ResponseException("Task not found!", 404);

      if (task.status === "done")
        throw new ResponseException("Cannot edit done tasks!", 401);

      const tagId = Number.parseInt(req.params.tagId);

      if (!hasTag(taskId, tagId))
        throw new ResponseException("Task doesnt have tag!", 404);

      const { title } = req.body;

      const tag = await updateTag(tagId, title);

      res.status(200).json(tag);
      next()
    } catch (error) {
      next(error);
    }
  }
);

controller.delete(
  "/:projectId/tasks/:taskId/tags/:tagId",
  checkSchema(deleteTagSchema),
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

      if (!task || task.projectId !== projectId)
        throw new ResponseException("Task not found!", 404);

      if (task.status === "done")
        throw new ResponseException("Cannot edit done tasks!", 401);

      const tagId = Number.parseInt(req.params.tagId);

      if (!hasTag(taskId, tagId))
        throw new ResponseException("Task doesnt have tag!", 404);

      await deleteTag(tagId);

      res.status(200).json({
        ok: "Deleted tag!"
      });
      next()
    } catch (error) {
      next(error);
    }
  }
);

controller.get(
  "/:projectId/tasks/:taskId/tags/",
  checkSchema(listTagsSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      // To see the tags of a task you need to be the owner or the member
      if (!isOwnerOrMember(projectId, userId))
        throw new ResponseException("Not owner or member of project!", 403);

      const taskId = Number.parseInt(req.params.taskId);

      const task = await getTask(taskId);

      if (!task) throw new ResponseException("Task not found!", 404);

      const tags = await listTags(taskId);

      res.status(200).send(tags);
      next()
    } catch (error) {
      next(error);
    }
  }
);

export default { controller, route } as Controller;
