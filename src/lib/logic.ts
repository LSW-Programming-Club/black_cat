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
        handleDetect(socket, game, file, player)
        break
      case 'disinfect':
        handleDisinfect(socket, game, file, player)
    }
  }
}

function handleDetect(socket: Socket, game: Game, file: File, player: Player) {
  // Tell the user about the file
  const chainFiles = findChainOfFiles(game, file)
  if (chainFiles.length === 0) {
    socket.emit('error', 'This file and files in the chain are already scanned. Try another')
    // Refund player's action
    player.actions++
  } else {
    game.detectedFiles.push(...chainFiles)
    socket.emit('file', game.fileList())
    socket.to(game.code).emit('file', game.fileList())
  }
}

function handleDisinfect(socket: Socket, game: Game, file: File, player: Player) {
  let removeMB = 1
  console.log(file.badData)
  if (file.badData < 1) {
    socket.emit('error', 'This file is already clean. Try another')
    // Refund player's action
    player.actions++
    return
  } else if (file.badData > 1) {
    removeMB = 2
  }
  file.badData = file.badData - removeMB
  if (file.badData === 0) {
    socket.emit('success', `Virus has been eradicated from file ${file.id}`)
  } else {
    socket.emit('success', `Some virus files have been removed ${file.badData}MB of bad data remaining in file ${file.id}`)
  }
  socket.emit('file', game.fileList())
  socket.to(game.code).emit('file', game.fileList())
}

function findChainOfFiles(game: Game, file: File): File[] {
  const chainFiles: File[] = []
  chainFiles.push(file)
  // Iterate until all the files in a row have been found
  for (let i = 0; i < chainFiles.length; i++) {
    // Iterate over the game's files
    for (const gameFile of game.files) {
      // Make sure that the proposed file isn't already in the list
      if (!chainFiles.includes(gameFile) && !game.detectedFiles.includes(gameFile)) {
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
  // Make sure to not duplicate file if its already been detected
  if (game.detectedFiles.includes(file)) {
    chainFiles.shift()
  }
  return chainFiles
}
