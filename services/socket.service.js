const logger = require('./logger.service')

let gIo = null
const mouseColors = ['#F28B82', '#FBBC04', '#CCFF90', '#A7FFEB', '#CBF0F8', '#F1E4DE', '#D7AEFB', '#FDCFE8', '#E6C9A8']
const connectedMouses = []

function setupSocketAPI(http) {
  gIo = require('socket.io')(http, {
    cors: {
      origin: '*',
    },
  })
  gIo.on('connection', (socket) => {
    logger.info(`New connected socket [id: ${socket.id}]`)
    socket.on('disconnect', (socket) => {
      logger.info(`Socket disconnected [id: ${socket.id}]`)
    })

    socket.on('wap connection', (editorId) => {
      if (socket.CurrEditorId === editorId) return
      if (socket.CurrEditorId) {
        socket.leave(socket.CurrEditorId)
        logger.info(`Socket is leaving room ${socket.CurrEditorId} [id: ${socket.id}]`)
      }
      socket.join(editorId)
      socket.CurrEditorId = editorId
      broadcast({ type: 'get wap', room: socket.CurrEditorId, userId: socket.id })
    })

    socket.on('wap update', (wap) => {
      logger.info(`Wap update from socket [id: ${socket.id}], emitting wap changes to ${socket.CurrEditorId}`)
      broadcast({ type: 'wap update', data: wap, room: socket.CurrEditorId, userId: socket.id })
    })

    socket.on('set-user-socket', (userId) => {
      logger.info(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
      socket.userId = userId
    })
    socket.on('unset-user-socket', () => {
      logger.info(`Removing socket.userId for socket [id: ${socket.id}]`)
      delete socket.userId
    })
    //mouse movement
    socket.on('mouse_position', ({ pos, user }) => {
      broadcast({ type: 'mouse_position_update', data: { id: socket.id, pos, user }, room: socket.CurrEditorId, userId: socket.id })
    })
  })
}

function emitTo({ type, data, label }) {
  if (label) gIo.to('watching:' + label).emit(type, data)
  else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
  const socket = await _getUserSocket(userId)

  if (socket) {
    logger.info(`Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`)
    socket.emit(type, data)
  } else {
    logger.info(`No active socket for user: ${userId}`)
    // _printSockets()
  }
}

// If possible, send to all sockets BUT not the current socket
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, room = null, userId }) {
  logger.info(`Broadcasting event: ${type}`)
  const excludedSocket = await _getUserSocket(userId)
  if (room && excludedSocket) {
    logger.info(`Broadcast to room ${room} excluding user: ${userId}`)
    excludedSocket.broadcast.to(room).emit(type, data)
  } else if (excludedSocket) {
    logger.info(`Broadcast to all excluding user: ${userId}`)
    excludedSocket.broadcast.emit(type, data)
  } else if (room) {
    logger.info(`Emit to room: ${room}`)
    gIo.to(room).emit(type, data)
  } else {
    logger.info(`Emit to all`)
    gIo.emit(type, data)
  }
}

async function _getUserSocket(userId) {
  const sockets = await _getAllSockets()
  // console.log(sockets.map((socket) => socket.id))
  const socket = sockets.find((s) => s.id === userId)
  return socket
}
async function _getAllSockets() {
  // return all Socket instances
  const sockets = await gIo.fetchSockets()
  return sockets
}

async function _printSockets() {
  const sockets = await _getAllSockets()
  console.log(`Sockets: (count: ${sockets.length}):`)
  sockets.forEach(_printSocket)
}
function _printSocket(socket) {
  console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
}

module.exports = {
  // set up the sockets service and define the API
  setupSocketAPI,
  // emit to everyone / everyone in a specific room (label)
  emitTo,
  // emit to a specific user (if currently active in system)
  emitToUser,
  // Send to all sockets BUT not the current socket - if found
  // (otherwise broadcast to a room / to all)
  broadcast,
}
