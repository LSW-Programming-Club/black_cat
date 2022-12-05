import { randomBytes, randomUUID } from 'crypto'

import type { Socket } from 'socket.io'

// Declare a dictionary to store the rooms and their players
class Player {
  id: string
  turnOrder: number
  actions: number
  build: string
  name: string

  constructor() {
    this.id = randomUUID()
    this.turnOrder = 0
    this.actions = 2
    this.build = ''
    this.name = 'Player'
  }
}

const sessions: { [room: string]: Player[] } = {}

export default (socket: Socket) => {
  // Create a room when a user requests to host a game
  socket.on('host', (name) => {
    const roomCode = createRoomCode(name)
    socket.join(roomCode)
    socket.emit('id', sessions[roomCode][0].id)
    socket.emit('success', roomCode)
    console.log(randomUUID())
  })

  socket.on('join', (data) => {
    // Check if the room exists
    if (data.code in sessions) {
      // Add the client to the room
      socket.join(data.code)

      // Add the client's name and class to the list of players in the room (ensure no duplicate names)
      const player = new Player()
      if (sessions[data.code].some((player) => player.name === data.name)) {
        let i = 2
        let newName = data.name + ' (' + i + ')'
        while (sessions[data.code].some((player) => player.name === newName)) {
          i++
          newName = data.name + ' (' + i + ')'
        }
        player.name = newName
      } else {
        player.name = data.name
      }
      player.id = randomUUID()
      sessions[data.code].push(player)
      // Respond to the client with the room code
      socket.emit('success', data.code)

      // Emit an updated list of players to all clients in the room
      const playerList = sessions[data.code].map((player) => ({ name: player.name, build: player.build }))
      socket.to(data.code).emit('players', playerList)
      socket.emit('players', playerList)
      socket.emit('id', player.id)
    } else {
      // If the room doesn't exist, respond to the client with an error
      socket.emit('error', 'Failed to join room')
    }
  })

  socket.on('type', (data) => {
    if (data.code in sessions && sessions[data.code].some((player) => player.id === data.id)) {
      // Update the client's class
      const index = sessions[data.code].findIndex((player) => player.id === data.id)
      sessions[data.code][index].build = data.type

      // Emit an updated list of players to all clients in the room
      const playerList = sessions[data.code].map((player) => ({ name: player.name, build: player.build }))
      socket.to(data.code).emit('players', playerList)
      socket.emit('players', playerList)
    }
  })
}

// A helper function that creates a unique room code
function createRoomCode(name: string) {
  let code = ''
  while (true) {
    code = randomBytes(3).toString('hex')
    if (!(code in sessions)) {
      const player = new Player()
      player.name = name
      sessions[code] = [player]
      break
    }
  }
  return code
}
