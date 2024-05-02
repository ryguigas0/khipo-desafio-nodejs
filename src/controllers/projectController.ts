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

const prisma = new PrismaClient()

const controller: Router = express.Router()
const route = "/users/projects"

controller.post(
    "/",
    checkSchema(newProjectIn),
    authenticateToken,
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId: userOwnerId } = req.claims
        const { name, description, memberIds } = req.body

        let newProjectData: any = {
            name: name,
            userOwnerId: userOwnerId
        }

        if (description) {
            newProjectData.description = description
        }


        try {
            const projModel = await prisma.project.create({
                data: {
                    name: name,
                    userOwnerId: userOwnerId,
                },
            })

            if (memberIds && memberIds.length > 0) {
                let memberUsers = await prisma.user.findMany({
                    where: {
                        id: {
                            in: memberIds
                        }
                    }
                })

                let usersProjectData = []

                for (let i = 0; i < memberUsers.length; i++) {
                    const member = memberUsers[i];
                    usersProjectData.push({
                        userId: member.id,
                        projectId: projModel.id
                    })
                }

                const usersToProject = await prisma.userToProject.createMany({
                    data: usersProjectData,
                    skipDuplicates: true
                })
            }

            res.status(200).json(projectView(projModel))
        } catch (error) {
            next(error)
        }
    }
)

controller.get(
    "/",
    checkSchema(listProjectsIn),
    authenticateToken,
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
                members: {
                    include: {
                        user: true
                    }
                },
            }
        })

        res.status(200).json(projectListView(projects))

    }
)




export default { controller, route } as Controller