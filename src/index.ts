// Web Server Setup
import express from 'express'
const app = express()
const port = 18080

// Enable interpreting POST requests
import bodyParser from 'body-parser'
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Allows server side rendering
app.set('view engine', 'ejs')

// Environment variable support for the project
import * as dotenv from 'dotenv'
dotenv.config()

// Static Web Files
app.use(express.static('public'))
// Flatten icons to /public for device support reasons
app.use(express.static('public/icons'))

// Import routing from other routers in ./routes
import { router as root } from './routes/root'
import { router as game } from './routes/game'

// Use the imported routers
app.use('/', root)
app.use('/game', game)
// Randomized 404
app.use(function (_req, res) {
  res.status(404)
  res.render('pages/root/404')
  return
})

// Have the server listen for incoming requests
app.listen(port, () => {
  console.log(`Blue Team is listening on http://127.0.0.1:${port}`)
})
