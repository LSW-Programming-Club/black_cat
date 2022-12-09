import type { Socket } from 'socket.io'

import { actions, games } from '../lib/db'

import { playerAction, playerMove, playerSmash } from '../lib/logic'

export default (socket: Socket) => {
  socket.on('start', (roomCode) => {
    handleStart(socket, roomCode)
  })

  socket.on('action', (roomCode, action, fileID) => {
    handleAction(socket, roomCode, action, fileID)
  })

  socket.on('move', (roomCode) => {
    handleMove(socket, roomCode)
  })

  socket.on('smash', (roomCode, playerX, playerY) => {
    handleSmash(socket, roomCode, playerX, playerY)
  })
}
//TODO: REMOVE 'export' AFTER DEBUG
export function handleStart(socket: Socket, roomCode: string) {
  const game = games.find((game) => game.code === roomCode)
  if (game && socket.id === game.host) {
    // Emit that game has started
    socket.emit('start', 'start')
    socket.to(roomCode).emit('start', 'start')

    // Emit initial file locations
    socket.emit('file', game.fileList())
    socket.to(roomCode).emit('file', game.fileList())
  } else {
    socket.emit('error', 'Only the host can start the game')
  }
}

function handleSmash(socket: Socket, roomCode: string, playerX: string, playerY: number) {
  const game = games.find((game) => game.code === roomCode)
  if (game) {
    const player = game.players.find((player) => player.id === socket.id)
    if (player && player.class) {
      if (!actions[player.class].includes('smash')) {
        socket.emit('error', `${player.class} can't use smash`)
        return
      }
      if (playerX != undefined && playerX.match('^[A-J]$') && playerY != undefined && playerY > 0 && playerY < 10) {
        playerSmash(socket, game, player, playerX, playerY)
      } else {
        socket.emit('error', `Please enter valid values for X and Y`)
      }
    } else {
      socket.emit('error', `Couldn't find player in game`)
    }
  }
}

function handleMove(socket: Socket, roomCode: string) {
  const game = games.find((game) => game.code === roomCode)
  if (game) {
    const player = game.players.find((player) => player.id === socket.id)
    if (player) {
      playerMove(socket, game, player)
    }
  }
}

function handleAction(socket: Socket, roomCode: string, action: string, fileID: number) {
  // Make sure the player can do this action based on their class
  const game = games.find((game) => game.code === roomCode)
  if (game) {
    const player = game.players.find((player) => player.id === socket.id)
    if (player && player.class in actions) {
      if (!actions[player.class].includes(action)) {
        // Prevent the player from performing the action
        socket.emit('error', `${player.class} can't use ${action}`)
        return
      }

      // Find the file listed in fileID if it exists
      const file = game.files.find((file) => file.id === Number(fileID))
      playerAction(socket, game, player, action, file)
    }
  }
}
