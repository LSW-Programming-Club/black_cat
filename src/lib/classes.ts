import { randomBytes, randomInt } from 'crypto'

import { games } from './db'

export class Player {
  id: string
  ready: boolean
  turnOrder: number
  actions: number
  class: string
  name: string

  constructor(name: string, id: string) {
    this.id = id
    this.ready = false
    this.turnOrder = 0
    this.actions = 2
    this.class = ''
    this.name = name
  }
}

export class File {
  id: number
  size: number
  goodData: number
  badData: number
  x: string
  y: number

  constructor(id: number) {
    this.id = id
    this.goodData = randomInt(1, 3)
    this.badData = randomInt(0, 3)
    this.size = this.goodData + this.badData
    this.x = 'A'
    this.y = 1
  }
}

export class Game {
  code: string
  host: string
  round: number
  hp: number
  files: File[]
  players: Player[]

  constructor(player: Player) {
    this.code = this.createCode()
    this.host = player.id
    this.round = 0
    this.hp = 10
    this.files = [new File(1), new File(2), new File(3)]
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
}
