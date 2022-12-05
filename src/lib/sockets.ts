import { randomBytes, randomInt, randomUUID } from 'crypto'

import type { Socket } from 'socket.io'

// Declare a dictionary to store the rooms and their players
class Player {
  id: string
  turnOrder: number
  actions: number
  build: string
  name: string

  constructor(name: string) {
    this.id = randomUUID()
    this.turnOrder = 0
    this.actions = 2
    this.build = ''
    this.name = name
  }
}

class File {
  id: number
  size: number
  goodData: number
  badData: number
  x: string
  y: number

  constructor(id: number) {
    this.id = id
    this.goodData = randomInt(1, 3)
    this.badData = randomInt(0, 3)
    this.size = this.goodData + this.badData
    this.x = 'A'
    this.y = 1
  }
}

class Game {
  code: string
  round: number
  hp: number
  files: File[]
  players: Player[]

  constructor(player: Player) {
    this.code = this.createCode()
    this.round = 0
    this.hp = 10
    this.files = [new File(1), new File(2), new File(3)]
    this.players = [player]
  }

  addPlayer(player: Player) {
    this.players.push(player)
  }

  createCode() {
    let code = ''
    while (true) {
      code = randomBytes(3).toString('hex')
      if (!(code in games)) {
        return code
      }
    }
  }

  playerList() {
    return this.players.map((player) => ({ name: player.name, build: player.build }))
  }
}

const games: Game[] = []

export default (socket: Socket) => {
  // Create a room when a user requests to host a game
  socket.on('host', (name) => {
    const player = new Player(name)
    const game = new Game(player)
    games.push(game)
    socket.join(game.code)
    socket.emit('success', game.code)
    socket.emit('id', player.id)
  })

  socket.on('join', (data) => {
    // Check if the room exists
    const game = games.find((game) => game.code === data.code)
    if (game) {
      // Add the client to the room
      socket.join(data.code)

      // Add the client's name and class to the list of players in the room (ensure no duplicate names)
      let newName = data.name
      if (games.find((game) => game.code === data.code)) {
        for (let i = 2; game.players.some((player) => player.name === newName); i++) {
          newName = data.name + ' (' + i + ')'
        }
      }
      const player = new Player(newName)
      game.addPlayer(player)
      // Respond to the client with the room code
      socket.emit('success', data.code)

      // Emit an updated list of players to all clients in the room
      socket.to(data.code).emit('players', game.playerList())
      socket.emit('players', game.playerList())
      socket.emit('id', player.id)
    } else {
      // If the room doesn't exist, respond to the client with an error
      socket.emit('error', 'Failed to join room')
    }
  })

  socket.on('type', (data) => {
    // Check if the room exists and if the player exists in the room
    const game = games.find((game) => game.code === data.code)
    if (!game) {
      // If the room doesn't exist, respond to the client with an error
      socket.emit('error', 'Failed to update class')
      return
    }

    const player = game.players.find((player) => player.id === data.id)
    if (!player) {
      // If the player doesn't exist, respond to the client with an error
      socket.emit('error', 'Failed to find player')
      return
    }

    // Update the player's class
    if (!data.build) {
      // If the class doesn't exist, respond to the client with an error
      socket.emit('error', 'Failed to find class')
      return
    }

    if (game.players.some((player) => player.build === data.build)) {
      // If the class is already in use, respond to the client with an error
      socket.emit('error', 'Someone is already that class try a different one')
      return
    }
    player.build = data.build

    // Emit an updated list of players to all clients in the room
    socket.to(game.code).emit('players', game.playerList())
    socket.emit('players', game.playerList())
  })
}
