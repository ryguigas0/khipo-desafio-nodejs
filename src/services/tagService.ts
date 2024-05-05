import { Tag } from "@prisma/client"
import prisma from "../db/prismaClient"
import { ResponseException } from "../errors/ResponseException"
import { getTask } from "./taskService"

export async function listTags(taskId: number): Promise<Tag[]> {
    const taskToTags = await prisma.taskToTag.findMany({
        where: {
            taskId: taskId
        },
        select: {
            tag: true
        },
    })

    return taskToTags.map(ttt => ttt.tag)
}

export async function createTag(taskId: number, title: string): Promise<Tag> {
    const tag = await prisma.tag.create({
        data: {
            title: title,
            tasks: {
                create: {
                    taskId: taskId
                }
            }
        }
    })

    return tag
}

export async function deleteTag(tagId: number): Promise<boolean> {
    const tag = await getTag(tagId)

    if (!tag) throw new ResponseException("Tag not found!", 404)

    await prisma.tag.delete({
        where: {
            id: tagId
        }
    })

    return true
}

export async function updateTag(tagId: number, title?: string): Promise<Tag> {
    if (!title) {
        throw new ResponseException("No update data provided!", 400)
    }

    const updatedTag = await prisma.tag.update({
        data: {
            title: title
        },
        where: {
            id: tagId
        }
    })

    return updatedTag

}

export async function getTag(tagId: number): Promise<Tag | null> {
    const tag = await prisma.tag.findUnique({
        where: {
            id: tagId
        }
    })

    return tag
}