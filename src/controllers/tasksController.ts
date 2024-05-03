import express, { Router, Response, NextFunction } from "express"
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import { projectListView, projectView } from "../views/projectView";
import listProjectsIn from "../validation/projects/listProjectsIn";
import newProjectIn from "../validation/projects/newProjectIn";
import deleteProjectSchema from "../validation/projects/deleteProjectSchema";
import updateProjectSchema from "../validation/projects/updateProjectSchema";
import projectMemberIn from "../validation/projects/projectMemberSchema";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { userView } from "../views/userView";
import getProjectSchema from "../validation/projects/getProjectSchema";
import newTaskIn from "../validation/tasks/newTaskIn";
import { taskView } from "../views/taskView";
import updateTaskIn from "../validation/tasks/updateTaskIn";
import deleteTaskIn from "../validation/tasks/deleteTaskIn";

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

async function isOwnerOrMember(projectId: number, userId: number) {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            OR: [
                {
                    userOwnerId: userId
                },
                {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                }
            ]
        }
    })

    return !(project === null)
}

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

            if (!await isOwnerOrMember(userId, projectId))
                throw new ResponseException("Only members or the owner of this project can edit tasks!", 401)

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

// controller.get(
//     "/:projectId",
//     checkSchema(getProjectSchema),
//     async (req: TokenRequest, res: Response, next: NextFunction) => {
//         try {
//             const errors = validationResult(req);
//             if (!errors.isEmpty()) {
//                 return res.status(400).json({ errors: errors.array() });
//             }

//             const userId = Number.parseInt(req.claims.userId)

//             const projectId = Number.parseInt(req.params.projectId)

//             // To see project info you need to be the owner or the member
//             const project = await prisma.project.findUnique({
//                 where: {
//                     id: projectId,
//                     OR: [
//                         {
//                             userOwnerId: userId
//                         },
//                         {
//                             members: {
//                                 some: {
//                                     user: {
//                                         id: userId
//                                     }
//                                 }
//                             }
//                         }
//                     ]
//                 },
//                 include: {
//                     owner: true,
//                     members: {
//                         include: {
//                             user: true
//                         }
//                     },
//                 }
//             })

//             if (!project) throw new ResponseException("Not owner or member of project!", 403)

//             res.status(200).send(projectView(project))
//         } catch (error) {
//             next(error)
//         }
//     }
// )

// controller.post(
//     "/:projectId/members/",
//     checkSchema(projectMemberIn),
//     async (req: TokenRequest, res: Response, next: NextFunction) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         try {
//             const userId = Number.parseInt(req.claims.userId)

//             const projectId = Number.parseInt(req.params.projectId)

//             const memberEmail = req.body.memberEmail

//             const user = await prisma.user.findUnique({
//                 where: {
//                     email: memberEmail
//                 }
//             })

//             if (!user) {
//                 throw new ResponseException(`User with email ${memberEmail} not found!`, 404)
//             }

//             let userToProject = await prisma.userToProject.create({
//                 data: {
//                     projectId: projectId,
//                     userId: user.id
//                 }
//             })

//             res.status(200).json(userView(user))
//         } catch (error) {
//             if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
//                 return next(new ResponseException("Member is already registered!", 400))
//             }
//             next(error)
//         }
//     }
// )

// controller.delete(
//     "/:projectId/members/",
//     checkSchema(projectMemberIn),
//     async (req: TokenRequest, res: Response, next: NextFunction) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const projectId = Number.parseInt(req.params.projectId)

//         const memberEmail = req.body.memberEmail

//         try {
//             const user = await prisma.user.findUnique({
//                 where: {
//                     email: memberEmail
//                 }
//             })

//             if (!user) {
//                 throw new ResponseException(`User with email ${memberEmail} not found!`, 404)
//             }

//             let userToProject = await prisma.userToProject.findUnique({
//                 where: {
//                     userId_projectId: {
//                         projectId: projectId,
//                         userId: user.id
//                     }
//                 }
//             })

//             if (!userToProject) {
//                 throw new ResponseException(`Member with email ${memberEmail} not found!`, 404)
//             }

//             await prisma.userToProject.delete({
//                 where: {
//                     userId_projectId: {
//                         projectId: projectId,
//                         userId: user.id
//                     }
//                 }
//             })

//             res.status(200).json({ ok: "Removed member!" })
//         } catch (error) {
//             if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
//                 return next(new ResponseException("Member not found!", 404))
//             }
//             next(error)
//         }
//     }
// )

export default { controller, route } as Controller