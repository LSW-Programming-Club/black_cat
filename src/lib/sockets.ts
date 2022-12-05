import { randomBytes } from 'crypto'

import type { Socket } from 'socket.io'

// Declare a dictionary to store the rooms and their players
const rooms: { [room: string]: string[] } = {}

export default (socket: Socket) => {
  // Create a room when a user requests to host a game
  socket.on('host', (name) => {
    const roomCode = createRoomCode(name)
    socket.join(roomCode)
    socket.emit('success', roomCode)
  })

  socket.on('join', (data) => {
    // Check if the room exists
    if (data.code in rooms) {
      // Add the client to the room
      socket.join(data.code)

      // Add the client's name to the list of players in the room
      rooms[data.code]?.push(data.name)

      // Respond to the client with the room code
      socket.emit('success', data.code)

      // Emit an updated list of players to all clients in the room
      socket.to(data.code).emit('players', rooms[data.code])
      socket.emit('players', rooms[data.code])
    } else {
      // If the room doesn't exist, respond to the client with an error
      socket.emit('error', 'Failed to join room')
    }
  })
}

// A helper function that creates a unique room code
function createRoomCode(name: string) {
  let code = ''
  while (true) {
    code = randomBytes(3).toString('hex')
    if (!(code in rooms)) {
      rooms[code] = [name]
      break
    }
  }
  return code
}
