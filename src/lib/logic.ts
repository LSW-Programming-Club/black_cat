import type { Socket } from 'socket.io'
import type { File, Game, Player } from './classes'

export function playerAction(socket: Socket, game: Game, player: Player, action: string, file?: File) {
  if (player.actions < 1) {
    socket.emit('error', `You can't ${action} since you are out of actions`)
    return
  }
  // Reduce player's actions by 1
  player.actions--
  // If the player is just moving then it will skip this statement and just remove a player's action
  if (file) {
    switch (action) {
      case 'detect':
        handleDetect(socket, file)
        break
      case 'disinfect':
        handleDisinfect(socket, game, file)
    }
  }
}

function handleDetect(socket: Socket, file: File) {
  // Tell the user about the file
  socket.emit('file', file)
}

function handleDisinfect(socket: Socket, game: Game, file: File) {
  console.log(socket, game, file)
}
