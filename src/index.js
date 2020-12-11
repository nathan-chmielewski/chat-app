// Core node modules
const path = require('path')
const http = require('http')
// NPM modules
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// Init express app
const app = express()
// Create a new web server using http library
// (Express library does this behind the scenes if we don't anyways) 
// We're just creating it outside of the express library to have access to set up socket.io 
const server = http.createServer(app)
// Create new instance of socket.io to config server to support web sockets
// Passing in http server
const io = socketio(server)
const port = process.env.PORT || 3000

// Define path for express config
// Create path to public directory
// __dirname is the cur directory of this file
const publicDirPath = path.join(__dirname, '../public')

// Set up static directory for express to serve up - public
// Using express static middleware
app.use(express.static(publicDirPath))

// server (emit) -> client (receive) -> countUpdated
// client (emit) -> server (receive) -> increment

const filter = new Filter()

// Listen for connection event
// Callback function arg socket - object containing client connection info
io.on('connection', (socket) => {
    
    // console.log('New WebSocket connection')

    // Listen for join event for client to join individual room using socket.io library
    socket.on('join', ({ username, room }, callback) => {
        // Add user to array
        const { error, user } = addUser({ 
            id: socket.id,
            username,
            room
        })
        
        // Throw error - call callback with error if addUser fails
        if (error) {
            return callback(error)
        }
        
        // User successfully added - use user properties because they have
        // been validated - trimmed and turned lowercase
        // Socket.io server method .join to join a given chat room
        socket.join(user.room)

        // Send Welcome message to new client connection
        socket.emit('message', generateMessage('Welcome!'))
        // broadcast event to all clients in room EXCEPT new client connection
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))
        // Send room user list
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // Send success ack - no arguments as there is no error
        callback()
    })

    // Listen for message event from client
    // Define callback to receive data message from client
    // Second arg in callback, 'callback', called to ack that message was received
    socket.on('sendMessage', (message, callback) => {
        // Get user
        const user = getUser(socket.id)
        // Message received
        // Emit message to all connected clients
        // Filter bad-words
        if (filter.isProfane(message)) {
            return callback('Error: Profanity is not allowed.')
        }
        
        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })

    // Receive location coordinates from client and emit google maps link to
    // client location to all clients - call callback() to send ack
    socket.on('sendLocation', (position, callback) => {
        // Get user
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, position))
        callback()
    })

    // Built-in event when a client disconnects
    // socket.io controls emitting this event, similar to connection
    socket.on('disconnect', () => {
        // Remove user from array
        const user = removeUser(socket.id)

        // Emit message to room on user disconnect if they had successfully connected
        // and joined a room
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left the room.`))
            // Send room user list
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

// Start up server on localhost port 3000
server.listen(port, () => {
    // console.log(`Server is up on port ${ port }`)
})