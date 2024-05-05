import { User } from "@prisma/client"
import prisma from "../db/prismaClient"
import argon2 from "argon2"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { ResponseException } from "../errors/ResponseException"

export async function createUser(name: string, email: string, password: string): Promise<User> {
    let passwordHash = await argon2.hash(password)

    try {
        const model = await prisma.user.create({
            data: {
                name: name,
                email: email,
                hashPassword: passwordHash
            }
        })

        return model
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ResponseException("Email is already registered!", 400)
        } else {
            throw error
        }
    }
}

export async function listUsers(): Promise<User[]> {
    return await prisma.user.findMany()
}

export async function updateUser(userId: number, name?: string, email?: string, oldPassword?: string, newPassword?: string): Promise<User> {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })

    if (!user) throw new ResponseException("User not found!", 404)


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

        return updatedUser
    } else {
        throw new ResponseException("No update data provided!", 400)
    }
}

export async function deleteUser(userId: number): Promise<boolean> {
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

    return true
}