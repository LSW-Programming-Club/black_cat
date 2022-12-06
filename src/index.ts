// Web Server Setup
import express from 'express'
const app = express()
const port = 18080

// Static Web Files
app.use(express.static('public'))
// Flatten icons to /public for device support reasons
app.use(express.static('public/icons'))

// Route root of website to index.html
import path from 'path'
const router = express.Router()
router.get('/', function (_req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})

// Socket.io setup
import { createServer } from 'http'
const httpServer = createServer(app)

// Create the HTTP Server to use
import { Server } from 'socket.io'
const io = new Server(httpServer, {})

// Import the socket handlers from the sockets files
import lobby from './sockets/lobby'
import game from './sockets/game'
io.on('connection', (socket) => {
  lobby(socket)
  game(socket)
})

// Have the server listen for incoming requests
httpServer.listen(port, () => {
  console.log(`Blue Team is listening on http://127.0.0.1:${port}`)
})
