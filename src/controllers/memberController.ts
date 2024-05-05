import express, { Router, Response, NextFunction } from "express"
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import projectMemberIn from "../validation/projects/projectMemberSchema";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { userView } from "../views/userView";

const prisma = new PrismaClient()

const controller: Router = express.Router()
const route = "/projects"

controller.use(authenticateToken)

controller.post(
    "/:projectId/members/",
    checkSchema(projectMemberIn),
    async (req: TokenRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = Number.parseInt(req.claims.userId)

            const projectId = Number.parseInt(req.params.projectId)

            const memberEmail = req.body.memberEmail

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
            if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
                return next(new ResponseException("Member is already registered!", 400))
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
            if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
                return next(new ResponseException("Member not found!", 404))
            }
            next(error)
        }
    }
)

export default { controller, route } as Controller