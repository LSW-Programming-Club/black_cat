import { randomBytes, randomInt } from 'crypto'

import type { Socket } from 'socket.io'

// Declare a dictionary to store the rooms and their players
class Player {
  id: string
  host: boolean
  ready: boolean
  turnOrder: number
  actions: number
  build: string
  name: string

  constructor(name: string, id: string) {
    this.id = id
    this.host = false
    this.ready = false
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
    return this.players.map((player) => ({ name: player.name, build: player.build, ready: player.ready }))
  }
}

const games: Game[] = []

export default (socket: Socket) => {
  // Create a room when a user requests to host a game
  socket.on('host', (name) => {
    const player = new Player(name, socket.id)
    player.host = true
    const game = new Game(player)
    games.push(game)
    socket.join(game.code)
    socket.emit('success', game.code)
    socket.emit('id', player.id)
    socket.emit('players', game.playerList())
  })

  socket.on('join', (data) => {
    // Check if the room exists
    const game = games.find((game) => game.code === data.code)
    if (game) {
      // If player already in session send error
      if (game.players.some((player) => player.id === socket.id)) {
        socket.emit('error', 'Already in this room')
        return
      }
      // If lobby is full inform user
      if (game.players.length >= 3) {
        socket.emit('error', 'This lobby is full')
        return
      }

      // Add the client's name to the list of players in the room (ensure no duplicate names)
      let newName = data.name
      if (games.find((game) => game.code === data.code)) {
        for (let i = 2; game.players.some((player) => player.name === newName); i++) {
          newName = data.name + ' (' + i + ')'
        }
      }
      const player = new Player(newName, socket.id)
      game.addPlayer(player)

      // Add the client to the room
      socket.join(data.code)

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

  socket.on('build', (data) => {
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
    socket.emit('build', player.build)
  })

  socket.on('ready', (data) => {
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

    player.ready = !player.ready
    socket.to(data.code).emit('players', game.playerList())
    socket.emit('players', game.playerList())
    socket.emit('ready', player.ready)

    if (game.playerList().filter((player) => player.ready === true).length === game.playerList().length) {
      const hostID = game.players.find((player) => player.host === true)?.id
      socket.emit('startAllowed', hostID)
      socket.to(data.code).emit('startAllowed', hostID)
    } else {
      socket.emit('startAllowed', false)
    }
  })

  // Remove user if they disconnect from the lobby
  socket.conn.on('close', (_reason) => {
    const game = games.find((game) => game.players.some((player) => player.id === socket.id))
    // If user was in game remove them from the game
    if (game) {
      game.players = game.players.filter((player) => player.id !== socket.id)
      socket.to(game.code).emit('players', game.playerList())

      // If there is still a game make a random user host
      if (game.players.length > 0 && !game.players.some((player) => player.host)) {
        const newHostIndex = Math.floor(Math.random() * game.players.length)
        game.players[newHostIndex].host = true
      }
    }
  })
}
