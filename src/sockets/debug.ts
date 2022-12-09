//TODO: REMOVE WHOLE FILE AFTER DEBUG
import type { Socket } from 'socket.io'

import { games } from '../lib/db'
import { handleStart } from './game'
import { handleHost } from './lobby'

export default (socket: Socket) => {
  socket.on('godStart', (playerName) => {
    handleGodStart(socket, playerName)
  })

  socket.on('actionUp', (roomCode) => {
    handleActionUp(socket, roomCode)
  })
}

function handleGodStart(socket: Socket, playerName: string) {
  handleStart(socket, handleHost(socket, playerName))
}

function handleActionUp(socket: Socket, roomCode: string) {
  const game = games.find((game) => game.code === roomCode)
  if (game) {
    const player = game.players.find((player) => player.id === socket.id)
    if (player) {
      player.actions++
      socket.emit('success', `You now have ${player.actions} actions`)
    }
  }
}
