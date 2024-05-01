import express, { Router, Request, Response, NextFunction } from "express"
import { Controller } from "./controllerInterface";
import { Prisma, PrismaClient } from "@prisma/client";
import { body, checkSchema, validationResult } from "express-validator";
import newUserInSchema from "../validation/NewUserIn";
import { userListView, userView } from "../views/users";


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

        try {
            const model = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    hash_password: password
                }
            })

            res.status(201).send(userView(model))
        } catch (error) {
            next(error)
        }
    });

controller.get(
    '/',
    async (req: Request, res: Response) => {
        const users = await prisma.user.findMany()

        res.status(200).send(userListView(users))
    }
)

export default { controller, route } as Controller