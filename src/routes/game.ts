import express from 'express'
const router = express.Router()

/* GET home page. */
router.get('/', function (_req, res) {
  res.render('pages/game/index')
})

export { router }
