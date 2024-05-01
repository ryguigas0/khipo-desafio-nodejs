import { User } from "@prisma/client";


interface UserOut {
    id: number,
    email: string,
    name: string
}

export function userListView(users: User[]): UserOut[] {

    let accViews: UserOut[] = []

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        accViews.push(userView(user))
    }

    return accViews
}

export function userView(user: User): UserOut {
    return {
        id: user.id,
        email: user.email,
        name: user.name
    }
}