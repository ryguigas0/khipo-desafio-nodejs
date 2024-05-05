import express, { Router, Response, NextFunction } from "express"
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import newTaskIn from "../validation/tasks/newTaskIn";
import { taskView, tasksListView } from "../views/taskView";
import updateTaskIn from "../validation/tasks/updateTaskIn";
import deleteTaskIn from "../validation/tasks/deleteTaskIn";
import listTasksIn from "../validation/tasks/listTaskSchema";
import { isOwnerOrMember } from "../services/projectService";
import { createTask, listTasks, updateTask } from "../services/taskService";

const prisma = new PrismaClient()

const controller: Router = express.Router()
const route = "/projects"

controller.use(authenticateToken)

controller.post(
    "/:projectId/tasks/",
    checkSchema(newTaskIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = Number.parseInt(req.claims.userId)
        const projectId = Number.parseInt(req.params.projectId)

        try {
            // Not members or owners cannot create tasks
            if (!await isOwnerOrMember(projectId, userId))
                throw new ResponseException("Not owner or member of project!", 403)

            let { title, description, assignedMemberId, tags } = req.body

            if (assignedMemberId) {
                assignedMemberId = Number.parseInt(assignedMemberId)
            }

            const taskModel = await createTask(projectId, title, description, assignedMemberId, tags)

            res.status(200).json(taskView(taskModel))
        } catch (error) {
            next(error)
        }
    }
)

controller.put(
    "/:projectId/tasks/:taskId",
    checkSchema(updateTaskIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            if (!(await isOwnerOrMember(projectId, userId))) throw new ResponseException("Not owner or member of project!", 403)

            const taskId = Number.parseInt(req.params.taskId)

            const { title, description, assignedMemberId, status } = req.body

            const updatedTask = await updateTask(projectId, taskId, title, description, assignedMemberId, status)

            res.status(200).send(taskView(updatedTask))
        } catch (error) {
            return next(error)
        }
    }
)

controller.delete(
    "/:projectId/tasks/:taskId",
    checkSchema(deleteTaskIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            if (!await isOwnerOrMember(userId, projectId))
                throw new ResponseException("Only members or the owner of this project can remove tasks!", 401)

            const taskId = Number.parseInt(req.params.taskId)

            const task = await prisma.task.findUnique({
                where: {
                    id: taskId
                }
            })

            if (!task) throw new ResponseException("Task not found!", 404)

            if (task.status === "done") throw new ResponseException("Cannot edit done tasks!", 401)

            await prisma.task.delete({
                where: {
                    id: taskId
                }
            })

            res.status(200).json({
                ok: "Deleted task!"
            })
        } catch (error) {
            next(error)
        }
    }
)

controller.get(
    "/:projectId/tasks/",
    checkSchema(listTasksIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            // To see task list you need to be the owner or the member
            if (!isOwnerOrMember(projectId, userId)) throw new ResponseException("Not owner or member of project!", 403)

            const { status } = req.query

            const tasks = await listTasks(status as string | string[] | undefined)

            res.status(200).send(tasksListView(tasks))
        } catch (error) {
            next(error)
        }
    }
)


export default { controller, route } as Controller