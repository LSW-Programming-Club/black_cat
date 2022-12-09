import { randomBytes, randomInt } from 'crypto'

import { games } from './db'

export class Player {
  public readonly id: string
  public name: string
  public class: string
  public ready: boolean
  public actions: number

  constructor(name: string, id: string) {
    this.id = id
    this.name = name
    this.class = ''
    this.ready = false
    this.actions = 2
  }
}

export class File {
  public readonly id: number
  public goodData: number
  public badData: number
  public size: number
  public x: number
  public y: number

  constructor(id: number) {
    this.id = id
    this.goodData = randomInt(1, 3)
    this.badData = randomInt(1, 3)
    this.size = this.goodData + this.badData
    this.x = 0
    this.y = 0
  }

  xToString(x: number) {
    return String.fromCharCode(64 + x)
  }

  xToNumber(x: string) {
    return Number(x.charCodeAt(0) - 64)
  }

  generateRandomXY(files: File[]) {
    // Generate a random x and y for the board
    const x = randomInt(1, 9)
    const y = randomInt(1, 9)

    // Check if the row and column indexes are outside of the cutout
    // The cutout is a 5x5 square in the middle of the board, so we check if the
    // row and column indexes are not between 2 and 6 (the indexes of the cutout)
    if (x < 2 || x > 6 || y < 2 || y > 6) {
      if (this.checkFileOverlap(files, x, y)) {
        this.generateRandomXY(files)
        return
      }
      // If the indexes are outside of the cutout, return the value at that index
      this.x = x
      this.y = y
    } else {
      // If the indexes are inside the cutout, try again with a new random row and column
      this.generateRandomXY(files)
    }
  }

  moveTowardComputer(files: File[]) {
    // Proposed numbers
    let checkX = this.x
    let checkY = this.y
    const attemptedDiagonals: number[] = [-2]
    let flippedXY = false

    // Make sure not touching other file
    while (this.checkFileOverlap(files, checkX, checkY)) {
      const computerX = 5
      const computerY = 5

      // Complex anti-crash diagonal technology TM
      let diagonal = -2
      while (attemptedDiagonals.length < 3 && attemptedDiagonals.includes(diagonal)) {
        diagonal = randomInt(-1, 1)
      }

      // If out of diagonals
      if (diagonal === -2) {
        // If already tried flippedXY and still no moves, don't move
        if (flippedXY) {
          return
        }
        // Flip X and Y to try different move set
        flippedXY = true
      }
      // If not out of diagonals
      else {
        attemptedDiagonals.push(diagonal)
      }

      // Declare how much movement in each direction
      let moveX = 0
      let moveY = 0

      // If farther away in x direction than y direction
      if (Math.abs(this.x - computerX) > Math.abs(this.y - computerY) != flippedXY) {
        // If file is to the right of computer
        if (this.x - computerX > 0) {
          // Move left 1
          moveX = -1
        }
        // If file is to the left of computer
        else {
          // Move right 1
          moveX = 1
        }

        // Implement diagonal movement or lack there of. If it is close to computer go towards it
        if (Math.abs(this.x - computerX) != 1) {
          moveY = diagonal
        } else {
          const yDiff = this.y - computerY
          switch (true) {
            case yDiff === 0:
              moveY = 0
              break
            case yDiff > 0:
              moveY = -1
              break
            case yDiff < 0:
              moveY = 1
              break
          }
        }
      }
      // If farther away in y direction than x direction (or they are same distance away)
      else {
        // If file is below the computer
        if (this.y - computerY > 0) {
          // Move up 1
          moveY = -1
        }
        // If file is above the computer
        else {
          // Move down 1
          moveY = 1
        }

        // Implement diagonal movement or lack there of. If it is close to computer go towards it
        if (Math.abs(this.y - computerY) != 1) {
          moveX = diagonal
        } else {
          const xDiff = this.x - computerX
          switch (true) {
            case xDiff === 0:
              moveX = 0
              break
            case xDiff > 0:
              moveX = -1
              break
            case xDiff < 0:
              moveX = 1
              break
          }
        }
      }

      // Add proposed numbers together to get spot
      checkX = this.x + moveX
      checkY = this.y + moveY
    }

    // Set file values once they are checked to be good
    this.x = checkX
    this.y = checkY
  }

  checkFileOverlap(files: File[], x: number, y: number) {
    // Make sure file not out of bounds
    if (x < 1 || y < 1 || x > 9 || y > 9) {
      return true
    }
    for (const gameFile of files) {
      // If conflict with already existing game file than try again
      if (gameFile.x === x && gameFile.y === y) {
        return true
      }
    }
    return false
  }
}

export class Game {
  public readonly code: string
  public host: string
  public round: number
  public hp: number
  public files: File[]
  public totalFiles: number
  public detectedFiles: File[]
  public players: Player[]

  constructor(player: Player) {
    this.code = this.createCode()
    this.host = player.id
    this.round = 1
    this.hp = 10
    this.files = []
    this.totalFiles = 0
    this.detectedFiles = []
    this.players = [player]
    this.createFiles(5)
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

  createFiles(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.totalFiles++
      const file = new File(this.totalFiles)
      file.generateRandomXY(this.files)
      this.files.push(file)
    }
  }

  moveFiles() {
    for (const file of this.files) {
      file.moveTowardComputer(this.files)
    }
  }

  resetPlayerActions() {
    for (const player of this.players) {
      player.actions = 2
    }
  }

  playerList() {
    return this.players.map((player) => ({ name: player.name, class: player.class, ready: player.ready }))
  }

  fileList() {
    const fileList = []
    // Push the detected files so far
    const detectedFiles = this.detectedFiles.map((file) => ({
      id: file.id,
      x: file.xToString(file.x),
      y: file.y,
      goodData: file.goodData,
      badData: file.badData
    }))
    fileList.push(...detectedFiles)

    // Push the unknown files
    const unknownFiles = this.files
      .filter((file) => {
        // Return true if the file is not in the detectedFiles list
        return !this.detectedFiles.some((detectedFile) => detectedFile.id === file.id)
      })
      .map((file) => ({
        id: file.id,
        x: file.xToString(file.x),
        y: file.y,
        goodData: '?',
        badData: '?'
      }))
    fileList.push(...unknownFiles)

    return fileList
  }
}
