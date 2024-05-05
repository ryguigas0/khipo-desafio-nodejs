import { PrismaClient } from "@prisma/client"

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