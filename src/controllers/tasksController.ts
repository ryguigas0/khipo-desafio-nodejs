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

            const { title, description, assignedMemberId, tags } = req.body

            let newTaskData: any = {
                projectId: projectId,
                title: title
            }

            if (description) {
                newTaskData.description = description
            }

            if (assignedMemberId) {
                // Check if its the owner or member assigned
                if (!await isOwnerOrMember(projectId, Number.parseInt(assignedMemberId)))
                    throw new ResponseException("Assigned member not owner or member of project!", 403)

                newTaskData.assignedMemberId = assignedMemberId
            }

            if (tags && tags.length > 0) {
                newTaskData.tags = {
                    create: []
                }

                let accTags = []

                for (let i = 0; i < tags.length; i++) {
                    const tag = tags[i];

                    accTags.push({
                        tag: {
                            create: {
                                title: tag
                            }
                        }
                    })
                }

                newTaskData.tags.create = accTags
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
            })

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

            const task = await prisma.task.findUnique({
                where: {
                    id: taskId
                }
            })

            if (!task) throw new ResponseException("Task not found!", 404)

            if (task.status === "done") throw new ResponseException("Cannot edit done tasks!", 401)

            const { title, description, assignedMemberId, status } = req.body

            let updateData: any = {}

            if (assignedMemberId) {
                if (!await isOwnerOrMember(assignedMemberId, projectId))
                    throw new ResponseException("Only members or the owner of this project can be assigned tasks!", 401)

                updateData.assignedMemberId = assignedMemberId
            }

            if (title) {
                updateData.title = title
            }

            if (description) {
                updateData.description = description
            }

            if (status) {
                updateData.status = status
            }

            if (Object.keys(updateData).length > 0) {
                const updatedTask = await prisma.task.update({
                    where: {
                        id: taskId
                    },
                    data: updateData
                })

                res.status(200).send(taskView(updatedTask))
            } else {
                throw new ResponseException("No update data provided!", 400)
            }
        } catch (error) {
            next(error)
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

            const filters: any = {}

            if (status) {
                filters.status = status
            }

            // const queryData = 

            const tasks = await prisma.task.findMany({
                include: {
                    assignedMember: true,
                    tags: {
                        select: {
                            tag: true
                        }
                    }
                },
                where: {
                    status: "done"
                }
            })

            res.status(200).send(tasksListView(tasks))
        } catch (error) {
            next(error)
        }
    }
)


export default { controller, route } as Controller