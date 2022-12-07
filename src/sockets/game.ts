import type { Socket } from 'socket.io'

import { actions, games } from '../lib/db'

import { playerAction } from '../lib/logic'

export default (socket: Socket) => {
  socket.on('start', (roomCode) => {
    handleStart(socket, roomCode)
  })

  socket.on('action', (roomCode, action, fileID) => {
    handleAction(socket, roomCode, action, fileID)
  })
}

function handleStart(socket: Socket, roomCode: string) {
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
