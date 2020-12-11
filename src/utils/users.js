// Functions to keep track of users
// addUser, removeUser, getUser, getUsersInRoom

const users = []

// addUser takes id (from socket), username, room args
const addUser = ({ id, username, room }) => {
    // Clean data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate data - check username or room string not empty
    if (!username || !room) {
        return {
            error: 'Username and room are required.'
        }
    }

    // Check for existing username in room
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username - if existingUser found, throw error
    if (existingUser) {
        return {
            error: 'Username in use, please choose another username.'
        }
    }

    // Store user
    const user = {
        id,
        username,
        room
    }

    users.push(user)
    return {
        user
    }
}

// Remove user by id
const removeUser = (id) => {
    // Get user index in users array - stops when match found or end of list
    const index = users.findIndex((user) => {
        return user.id === id
    })

    if (index !== -1) {
        // Remove user using splice - passing in index of user to remove
        // and num of items to remove
        // Splice returns an array of all items removed
        // Return object of user removed by index - 0, an array of one
        return users.splice(index, 1)[0]
    }
}

// Get user by id, return user or undefined
const getUser = (id) => {
    // Use array find method
    return users.find((user) => {
        return user.id === id
    })
}

// Given a room, return array of users in a room
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    // Use array filter method
    return users.filter((user) => {
        return user.room === room
    })
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
