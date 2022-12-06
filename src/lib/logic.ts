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
        handleDetect(socket, game, file)
        break
      case 'disinfect':
        handleDisinfect(socket, game, file)
    }
  }
}

function handleDetect(socket: Socket, game: Game, file: File) {
  // Tell the user about the file
  socket.emit('file', findChainOfFiles(game, file))
}

function handleDisinfect(socket: Socket, game: Game, file: File) {
  console.log(socket, game, file)
}

function findChainOfFiles(game: Game, file: File): File[] {
  const chainFiles: File[] = []
  chainFiles.push(file)
  // Iterate until all the files in a row have been found
  for (let i = 0; i < chainFiles.length; i++) {
    // Iterate over the game's files
    for (const gameFile of game.files) {
      // Make sure that the proposed file isn't already in the list
      if (!chainFiles.includes(gameFile)) {
        // Check if the is one square away horizontally and zero vertically and vice versa
        const xDiff = Math.abs(gameFile.x - chainFiles[i].x)
        const yDiff = Math.abs(gameFile.y - chainFiles[i].y)
        if ((xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff)) {
          // If so, add the file to the list of chained files
          chainFiles.push(gameFile)
        }
      }
    }
  }
  return chainFiles
}
