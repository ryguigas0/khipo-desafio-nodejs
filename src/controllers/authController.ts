import express, { Router, Request, Response, NextFunction } from "express"
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import tokenCredentials from "../validation/TokenCredentials";
import tokenView from "../views/tokenView"
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import jwt from "jsonwebtoken"
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";

import { jwtDuration, jwtSecret } from "../env";

const prisma = new PrismaClient()

const controller: Router = express.Router()
const route = "/auth"



controller.get('/token',
    checkSchema(tokenCredentials),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body

        try {
            let user = await prisma.user.findUnique({
                where: {
                    email: email
                },
                include: {
                    projects: true
                }
            })

            if (user === null) {
                res.status(404).send("User not found!")
            } else if (await argon2.verify(user.hashPassword, password)) {
                let ownedProjects = user.projects.map(p => p.projectId)

                let claims = {
                    userId: user.id,
                    ownedProjects
                }

                const accessToken = jwt.sign(claims, jwtSecret, { expiresIn: jwtDuration })

                res.status(201).send(tokenView(accessToken, jwtDuration))
            } else {
                res.status(401).send("Unauthenticated!")
            }
        } catch (error) {
            next(error)
        }

    });

controller.get('/public', (req: Request, res: Response) => {
    res.send('Public page');
});

controller.get('/protected', authenticateToken, (req: TokenRequest, res: Response) => {
    console.log(req.claims)
    res.send('private page');
});

export default { controller, route } as Controller