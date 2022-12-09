// Import dependencies
import express from 'express'
import path from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import socket handlers
import lobby from './sockets/lobby'
import game from './sockets/game'
//TODO: REMOVE AFTER DEBUG
import debug from './sockets/debug'

// Web Server Setup
const app = express()
const port = 18080

// Static Web Files
app.use(express.static('public'))
app.use(express.static('public/icons'))

// Route root of website to index.html
const router = express.Router()
router.use('/index.html', function (_req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Use the router to handle requests
app.use(router)

// Socket.io setup
const httpServer = createServer(app)
const io = new Server(httpServer, {})

// Register socket handlers
io.on('connection', (socket) => {
  lobby(socket)
  game(socket)
  //TODO: REMOVE AFTER DEBUG
  debug(socket)
})

// Have the server listen for incoming requests
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Blue Team is listening on http://127.0.0.1:${port}`)
})
