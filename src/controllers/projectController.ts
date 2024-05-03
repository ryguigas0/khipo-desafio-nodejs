import express, { Router, Request, Response, NextFunction } from "express"
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { check, checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authController from "./authController";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import { projectListView, projectView } from "../views/projectView";
import listProjectsIn from "../validation/projects/listProjectsIn";
import newProjectIn from "../validation/projects/newProjectIn";
import deleteProjectSchema from "../validation/projects/deleteProjectSchema";
import updateProjectSchema from "../validation/projects/updateProjectSchema";
import projectMemberIn from "../validation/projects/projectMemberSchema";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { handlePrismaError } from "../errors/prismaErrorHandler";
import { userView } from "../views/userView";
import getProjectSchema from "../validation/projects/getProjectSchema";

const prisma = new PrismaClient()

const controller: Router = express.Router()
const route = "/projects"

controller.use(authenticateToken)

controller.post(
    "/",
    checkSchema(newProjectIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId: userOwnerId } = req.claims
        const { name, description } = req.body

        let newProjectData: any = {
            name: name,
            userOwnerId: userOwnerId
        }

        if (description) {
            newProjectData.description = description
        }


        try {
            const projModel = await prisma.project.create({
                data: newProjectData,
            })

            res.status(200).json(projectView(projModel))
        } catch (error) {
            next(error)
        }
    }
)

controller.put(
    "/:projectId",
    checkSchema(updateProjectSchema),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userOwnerId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                    userOwnerId: userOwnerId
                }
            })

            // Not owners cannot edit project
            if (!project) throw new ResponseException("Not owner of project or project was not created!", 404)

            const { name, description } = req.body

            let updateData: any = {}

            if (name) {
                updateData.name = name
            }

            if (description) {
                updateData.description = description
            }

            if (Object.keys(updateData).length > 0) {
                const updatedProject = await prisma.project.update({
                    where: {
                        id: projectId
                    },
                    data: updateData
                })

                res.status(200).send(projectView(updatedProject))
            } else {
                throw new ResponseException("No update data provided!", 400)
            }
        } catch (error) {
            next(error)
        }
    }
)

controller.delete(
    "/:projectId",
    checkSchema(deleteProjectSchema),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userOwnerId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                    userOwnerId: userOwnerId
                }
            })

            // Not owners cannot edit project
            if (!project) throw new ResponseException("Not owner of project or project was not created!", 404)

            await prisma.project.delete({
                where: {
                    id: projectId
                }
            })

            res.status(200).send({ ok: "Deleted project!" })
        } catch (error) {
            next(error)
        }
    }
)

controller.get(
    "/:projectId",
    checkSchema(getProjectSchema),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            // To see project info you need to be the owner or the member
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
                                    user: {
                                        id: userId
                                    }
                                }
                            }
                        }
                    ]
                },
                include: {
                    owner: true,
                    members: {
                        include: {
                            user: true
                        }
                    },
                }
            })

            if (!project) throw new ResponseException("Not owner or member of project!", 403)

            res.status(200).send(projectView(project))
        } catch (error) {
            next(error)
        }
    }
)


controller.get(
    "/",
    checkSchema(listProjectsIn),
    async (req: TokenRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.claims
        const { owned, member } = req.query

        const projects = await prisma.project.findMany({
            where: {
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
            },
            include: {
                owner: true,
                // members: {
                //     include: {
                //         user: true
                //     }
                // },
            }
        })

        res.status(200).json(projectListView(projects))

    }
)



controller.post(
    "/:projectId/members/",
    checkSchema(projectMemberIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const projectId = Number.parseInt(req.params.projectId)

        const memberEmail = req.body.memberEmail

        try {
            const user = await prisma.user.findUnique({
                where: {
                    email: memberEmail
                }
            })

            if (!user) {
                throw new ResponseException(`User with email ${memberEmail} not found!`, 404)
            }

            let userToProject = await prisma.userToProject.create({
                data: {
                    projectId: projectId,
                    userId: user.id
                }
            })

            res.status(200).json(userView(user))
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                return next(handlePrismaError(`Member ${memberEmail}`, error))
            }
            next(error)
        }
    }
)

controller.delete(
    "/:projectId/members/",
    checkSchema(projectMemberIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const projectId = Number.parseInt(req.params.projectId)

        const memberEmail = req.body.memberEmail

        try {
            const user = await prisma.user.findUnique({
                where: {
                    email: memberEmail
                }
            })

            if (!user) {
                throw new ResponseException(`User with email ${memberEmail} not found!`, 404)
            }

            let userToProject = await prisma.userToProject.findUnique({
                where: {
                    userId_projectId: {
                        projectId: projectId,
                        userId: user.id
                    }
                }
            })

            if (!userToProject) {
                throw new ResponseException(`Member with email ${memberEmail} not found!`, 404)
            }

            await prisma.userToProject.delete({
                where: {
                    userId_projectId: {
                        projectId: projectId,
                        userId: user.id
                    }
                }
            })

            res.status(200).json({ ok: "Removed member!" })
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                return next(handlePrismaError(`Member ${memberEmail}`, error))
            }
            next(error)
        }
    }
)




export default { controller, route } as Controller