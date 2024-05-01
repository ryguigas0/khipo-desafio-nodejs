import { User } from "@prisma/client";


export function userListView(users: User[]) {

    let accViews = []

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        accViews.push(user)
    }

    return accViews
}

export function userView(user: User) {
    return {
        id: user.id,
        email: user.email,
        name: user.name
    }
}