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
    this.x = 1
    this.y = 1
  }

  xToString(x: number) {
    return String.fromCharCode(64 + x)
  }

  xToNumber(x: string) {
    return Number(x.charCodeAt(0) - 64)
  }
}

export class Game {
  public readonly code: string
  public host: string
  public round: number
  public hp: number
  public files: File[]
  public detectedFiles: File[]
  public players: Player[]

  constructor(player: Player) {
    this.code = this.createCode()
    this.host = player.id
    this.round = 0
    this.hp = 10
    this.files = [new File(1), new File(2), new File(3), new File(4), new File(5)]
    this.detectedFiles = []
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
