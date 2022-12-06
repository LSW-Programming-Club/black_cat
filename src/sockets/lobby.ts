import type { Socket } from 'socket.io'

import { Player, Game } from '../lib/classes'

import { games, classes } from '../lib/db'

export default (socket: Socket) => {
  // Create a room when a user requests to host a game
  socket.on('host', (playerName) => {
    handleHost(socket, playerName)
  })

  socket.on('join', (roomCode, playerName) => {
    handleJoin(socket, roomCode, playerName)
  })

  socket.on('class', (roomCode, playerBuild) => {
    handleClass(socket, roomCode, playerBuild)
  })

  socket.on('ready', (roomCode) => {
    handleReady(socket, roomCode)
  })

  // Remove user if they disconnect from the lobby
  socket.conn.on('close', (_reason) => {
    handleClose(socket)
  })
}

function handleHost(socket: Socket, playerName: string) {
  // Create a new player with the users data
  const player = new Player(playerName, socket.id)

  // Create the game and push it to the game list
  const game = new Game(player)
  games.push(game)

  // Set user to be the host
  game.host = socket.id

  // Create the room and push the code and player list to the user
  socket.join(game.code)
  socket.emit('code', game.code)
  socket.emit('players', game.playerList())
}

function handleJoin(socket: Socket, roomCode: string, playerName: string) {
  // Check if the room exists
  const game = games.find((game) => game.code === roomCode)
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
    const baseName = playerName
    for (let i = 2; game.players.some((player) => player.name === playerName); i++) {
      playerName = baseName + ' (' + i + ')'
    }
    const player = new Player(playerName, socket.id)
    game.addPlayer(player)

    // Add the client to the room and tell them the code
    socket.join(roomCode)
    socket.emit('code', roomCode)

    // Emit an updated list of players to all clients in the room
    socket.to(roomCode).emit('players', game.playerList())
    socket.emit('players', game.playerList())
  } else {
    // If the room doesn't exist tell the client it doesn't exist
    socket.emit('error', 'Failed to join room')
  }
}

function handleClass(socket: Socket, roomCode: string, playerClass: string) {
  // Find the game that the player is in
  const game = games.find((game) => game.code === roomCode)
  if (!game) {
    // If the room doesn't exist error
    socket.emit('error', 'Failed to find game')
    return
  }

  const player = game.players.find((player) => player.id === socket.id)
  if (!player) {
    // If the player doesn't exist error
    socket.emit('error', 'Failed to find player')
    return
  }

  // Check if the class exists
  if (!classes.includes(playerClass)) {
    // If the class isn't allowed error
    socket.emit('error', 'Failed to find class')
    return
  }

  if (game.players.some((player) => player.class === playerClass)) {
    // If the class is already in use, respond to the client with an error
    socket.emit('error', 'Someone is already using that class try a different one')
    return
  }

  //Push the player's class
  player.class = playerClass
  socket.emit('class', playerClass)

  // Emit an updated list of players to all clients in the room
  socket.to(game.code).emit('players', game.playerList())
  socket.emit('players', game.playerList())
}

function handleReady(socket: Socket, roomCode: string) {
  // Find the game that the player is in
  const game = games.find((game) => game.code === roomCode)
  if (!game) {
    // If the room doesn't exist error
    socket.emit('error', 'Failed to find game')
    return
  }

  const player = game.players.find((player) => player.id === socket.id)
  if (!player) {
    // If the player doesn't exist error
    socket.emit('error', 'Failed to find player')
    return
  }

  // Flip the player's ready position
  player.ready = !player.ready
  socket.emit('ready', player.ready)

  // Emit an updated list of players to all clients in the room
  socket.to(roomCode).emit('players', game.playerList())
  socket.emit('players', game.playerList())

  if (game.players.length === 3 && game.playerList().filter((player) => player.ready === true).length === game.playerList().length) {
    socket.emit('startAllowed', game.host)
    socket.to(roomCode).emit('startAllowed', game.host)
  } else {
    socket.emit('startAllowed', false)
  }
}

function handleClose(socket: Socket) {
  const game = games.find((game) => game.players.some((player) => player.id === socket.id))
  // If user was in game remove them from the game
  if (game) {
    game.players = game.players.filter((player) => player.id !== socket.id)
    socket.to(game.code).emit('players', game.playerList())

    // If there is still a game make the next in line user host
    if (game.host === socket.id && game.players.length != 0) {
      game.host = game.players[0].id
    }
  }
}
