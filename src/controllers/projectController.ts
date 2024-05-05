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
import { isOwnerOrMember } from "../services/projectService";

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
            if (!(await isOwnerOrMember(projectId, userId))) throw new ResponseException("Not owner or member of project!", 403)

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                },
                include: {
                    owner: true,
                    members: {
                        select: {
                            user: true
                        }
                    },
                    tasks: true
                }
            })

            if (!project) throw new ResponseException("Project not found!", 404)

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

export default { controller, route } as Controller