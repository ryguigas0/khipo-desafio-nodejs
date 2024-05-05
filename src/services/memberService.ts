import { User } from "@prisma/client";
import prisma from "../db/prismaClient";
import { ResponseException } from "../errors/ResponseException";
import { getUser } from "./userService";

export async function addMember(memberEmail: string, projectId: number): Promise<User> {
    const user = await getUser(memberEmail)

    if (!user) throw new ResponseException("User with " + memberEmail + " not found!", 404)

    await prisma.userToProject.create({
        data: {
            projectId: projectId,
            userId: user.id
        }
    })

    return user
}

export async function removeMember(memberEmail: string, projectId: number): Promise<boolean> {
    const user = await getUser(memberEmail)

    if (!user) throw new ResponseException("User with " + memberEmail + " not found!", 404)

    let userToProject = await prisma.userToProject.findUnique({
        where: {
            userId_projectId: {
                projectId: projectId,
                userId: user.id
            }
        }
    })

    if (!userToProject) throw new ResponseException("Member with email " + memberEmail + " not found!", 404)

    await prisma.userToProject.delete({
        where: {
            userId_projectId: {
                projectId: projectId,
                userId: user.id
            }
        }
    })

    return true
}

export async function listMembers(projectId: number): Promise<User[]> {
    let projMembers = await prisma.user.findMany({
        where: {
            projects: {
                some: {
                    projectId: projectId
                }
            }
        }
    })

    return projMembers
}