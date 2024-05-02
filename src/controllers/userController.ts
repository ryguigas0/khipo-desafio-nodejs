import express, { Router, Request, Response, NextFunction } from "express"
import { Controller } from "./controllerInterface";
import { PrismaClient } from "@prisma/client";
import { checkSchema, validationResult } from "express-validator";
import { userListView, userView } from "../views/userView";
import argon2 from "argon2";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { handlePrismaError } from "../errors/prismaErrorHandler";
import { ResponseException } from "../errors/ResponseException";
import newUserInSchema from "../validation/user/NewUserIn";
import updateUserInSchema from "../validation/user/UpdateUserInSchema";
import deleteUserSchema from "../validation/user/DeleteUserSchema";


const prisma = new PrismaClient()

const route = "/users"
const controller: Router = express.Router()

controller.post(
    '/',
    checkSchema(newUserInSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body

        let passwordHash = await argon2.hash(password)

        try {
            const model = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    hashPassword: passwordHash
                }
            })

            res.status(201).send(userView(model))
        } catch (error: any) {
            if (error instanceof PrismaClientKnownRequestError || error instanceof PrismaClientUnknownRequestError) {
                return next(handlePrismaError("email", error))
            }

            next(error)
        }
    });

// ---------------------
// ADMIN ONLY ROUTES
// -----------------------

controller.get(
    '/',
    async (req: Request, res: Response) => {
        const users = await prisma.user.findMany()

        res.status(200).send(userListView(users))
    }
)

controller.put(
    '/:userId',
    checkSchema(updateUserInSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = Number.parseInt(req.params.userId)

            const user = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            })

            if (!user) throw new ResponseException("User not found!", 404)

            const { name, email, oldPassword, newPassword } = req.body

            let updateData: any = {}

            if (name) {
                updateData.name = name
            }

            if (email) {
                updateData.email = email
            }

            // new old -> update password?
            // true true -> do
            // true false -> throw
            // false true -> throw
            // false false -> skip
            // and gate
            if (oldPassword && newPassword) {
                if (!await argon2.verify(user.hashPassword, oldPassword)) {
                    throw new ResponseException("Old password is wrong!", 401)
                } else {
                    updateData.hashPassword = await argon2.hash(newPassword)
                }
            } else if (!oldPassword && newPassword || !newPassword && oldPassword) {
                throw new ResponseException("To change the password, the old and new one should be provided!", 400)
            }

            if (Object.keys(updateData).length > 0) {
                const updatedUser = await prisma.user.update({
                    where: {
                        id: userId
                    },
                    data: updateData
                })

                res.status(200).send(userView(updatedUser))
            } else {
                throw new ResponseException("No update data provided!", 400)
            }
        } catch (error) {
            next(error)
        }
    }
)

controller.delete(
    "/:userId",
    checkSchema(deleteUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = Number.parseInt(req.params.userId)

            const userFound = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            })

            if (!userFound) throw new ResponseException("User not found!", 404)

            await prisma.user.delete({
                where: {
                    id: userId
                }
            })

            res.status(200).send({ ok: "Deleted user!" })
        } catch (error) {
            next(error)
        }
    }
)


export default { controller, route } as Controller
