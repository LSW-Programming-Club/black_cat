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
        break
      case 'purge':
        handlePurge(socket, game, file, player)
        break
    }
  }

  handleTurn(socket, game, player)
}

export function handleTurn(socket: Socket, game: Game, player: Player) {
  // THIS CODE SHOULD NOT BE HERE. SHOULD RELOCATE WHEN HAVE TIME
  socket.emit('hp', game.hp)
  socket.to(game.code).emit('hp', game.hp)
  socket.emit('actionAmount', player.actions)

  // If players have used all of their actions
  if (game.players.find((player) => player.actions > 0) === undefined) {
    // Iterate round count
    game.round++

    // Reset players actions
    game.resetPlayerActions()

    // Move all the files
    game.moveFiles(socket, game)

    // If odd round then summon new file
    if (game.round % 2 === 1) {
      // Create 1 file
      game.createFiles(1)
    }


    // Send updated files
    socket.emit('file', game.fileList())
    socket.to(game.code).emit('file', game.fileList())

    socket.emit('success', `All players have used their actions. You are now on round ${game.round}`)
    socket.to(game.code).emit('success', `All players have used their actions. You are now on round ${game.round}`)

    for (const p of game.players) {
      socket.emit('actionAmount', p.actions)
    }
  }
}

export function playerMove(socket: Socket, game: Game, player: Player) {
  // Make sure the player has actions remaining
  if (player.actions < 1) {
    socket.emit('error', `You can't move since you are out of actions`)
    return
  }
  player.actions--
  let steps = 1
  // If class is scout give an extra move
  if (player.class === 'Scout') {
    steps = 2
  }
  socket.emit('success', `You may move ${steps} steps now`)
  socket.to(game.code).emit('success', `${player.name} has taken a move`)

  handleTurn(socket, game, player)
}

export function playerSmash(socket: Socket, game: Game, player: Player, stringX: string, playerY: number) {
  // Declare required variables
  const playerX = Number(stringX.charCodeAt(0) - 64)
  const damagedFiles: File[] = []

  // Loop through all DETECTED files to see if they are next to player
  for (const gameFile of game.detectedFiles) {
    const xDiff = Math.abs(gameFile.x - playerX)
    const yDiff = Math.abs(gameFile.y - playerY)
    if ((xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1)) {
      // If so, add the file to the list of chained files
      damagedFiles.push(gameFile)
    }
  }

  if (damagedFiles.length > 0) {
    //Reduce players actions by 1
    player.actions--

    // Damage files found
    for (const damagedFile of damagedFiles) {
      if (damagedFile.badData > 0) {
        damagedFile.badData--
      }
    }

    let plural = 's'
    if (damagedFiles.length > 1) {
      plural = ''
    }
    socket.emit('success', `${damagedFiles.length} file${plural} have had 1MB of bad data removed`)
    socket.to(game.code).emit('success', `${player.name} removed 1MB of bad data from ${damagedFiles.length} file${plural}`)
  } else {
    socket.emit('error', 'No files to smash. Try another action')
  }

  handleTurn(socket, game, player)
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
    socket.emit('success', `Successfully scanned ${chainFiles.length} files!`)
    socket.to(game.code).emit('success', `${player.name} successfully scanned ${chainFiles.length} files!`)
    socket.emit('file', game.fileList())
    socket.to(game.code).emit('file', game.fileList())
  }
}

function handleDisinfect(socket: Socket, game: Game, file: File, player: Player) {
  let removeMB = 1
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
    socket.to(game.code).emit('success', `${player.name} has eradicated all virus files from file ${file.id}`)
  } else {
    socket.emit('success', `Some virus files have been removed. ${file.badData}MB of bad data remaining in file ${file.id}`)
    socket.to(game.code).emit('success', `${player.name} has removed ${file.badData}MB of bad data remaining in file ${file.id}`)
  }
  socket.emit('file', game.fileList())
  socket.to(game.code).emit('file', game.fileList())
}

function handlePurge(socket: Socket, game: Game, purgedFile: File, player: Player) {
  // Remove the file from the records
  if (purgedFile) {
    game.files = game.files.filter((file) => file.id != purgedFile.id)
    game.detectedFiles = game.detectedFiles.filter((file) => file.id != purgedFile.id)
    socket.emit('success', `Purged file ${purgedFile.id}. Remove it from the game board`)
    socket.to(game.code).emit('success', ` ${player.name} purged file ${purgedFile.id}. Remove it from the game board`)
    socket.emit('file', game.fileList())
    socket.to(game.code).emit('file', game.fileList())
  } else {
    socket.emit('error', `Can't purge requested file because it is already gone`)
    // Refund player's action
    player.actions++
  }
}

export function findChainOfFiles(game: Game, file: File): File[] {
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
        if ((xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1)) {
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
