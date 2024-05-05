import { PrismaClient, Project } from "@prisma/client"
import prisma from "../db/prismaClient"
import { ResponseException } from "../errors/ResponseException"

export async function createProject(userOwnerId: number, name: string, description?: string): Promise<Project> {
    let newProjectData: any = {
        name: name,
        userOwnerId: userOwnerId
    }

    if (description) {
        newProjectData.description = description
    }

    const projModel = await prisma.project.create({
        data: newProjectData,
    })

    return projModel
}

export async function updateProject(userOwnerId: number, projectId: number, name?: string, description?: string) {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            userOwnerId: userOwnerId
        }
    })

    // Not owners cannot edit project
    if (!project) throw new ResponseException("Not owner of project or project was not created!", 404)

    let updateData: any = {}

    if (name) {
        updateData.name = name
    }

    if (description) {
        updateData.description = description
    }

    if (Object.keys(updateData).length > 0) {
        return await prisma.project.update({
            where: {
                id: projectId
            },
            data: updateData
        })
    } else {
        throw new ResponseException("No update data provided!", 400)
    }
}

export async function deleteProject(userOwnerId: number, projectId: number): Promise<boolean> {
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

    return true
}

export async function getProject(projectId: number, userId: number): Promise<Project> {
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

    return project
}

export async function isOwnerOrMember(projectId: number, userId: number) {
    const prisma = new PrismaClient()

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            OR: [
                {
                    userOwnerId: userId
                },
                {
                    NOT: {
                        members: {
                            none: {
                                projectId: projectId,
                                userId: userId
                            }
                        }
                    }
                }
            ]
        }
    })

    return !(project === null)
}