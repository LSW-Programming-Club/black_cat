import type { Socket } from 'socket.io'

export default (socket: Socket) => {
  socket.on('start', (data) => {
    console.log(data)
  })
}
