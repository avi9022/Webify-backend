const wapService = require('./wap.service')
const userService = require('../user/user.service')
const socketService = require('../../services/socket.service')
const logger = require('../../services/logger.service')

async function getWap(req, res) {
  try {
    const wap = await wapService.getById(req.params.id)
    res.send(wap)
  } catch (err) {
    logger.error('Failed to get wap', err)
    res.status(500).send({ err: 'Failed to get wap' })
  }
}

async function saveWap(req, res) {
  try {
    const wapToSave = await wapService.save(req.body)
    const user = await userService.getByUsername(wapToSave.createdBy)
    const miniWap = {
      _id: wapToSave._id,
      thunmbnail: wapToSave.thumbnail,
    }
    user.waps.unshift(miniWap)
    await userService.update(user)
    res.send(wapToSave)
  } catch (err) {
    logger.error('Failed to save wap', err)
    res.status(500).send({ err: 'Failed to save wap' })
  }
}

async function updateWap(req, res) {
  try {
    const wapToSave = req.body
    await wapService.update(req.params.id, wapToSave)
    const user = await userService.getByUsername(wapToSave.createdBy)
    const miniWap = {
      _id: wapToSave._id,
      thunmbnail: wapToSave.thumbnail,
    }
    const miniWapIdx = user.waps.findIndex((currWap) => currWap._id === wapToSave._id)
    user.waps.splice(miniWapIdx, 1, miniWap)
    await userService.update(user)
    res.send(wapToSave)
  } catch (err) {
    logger.error('Failed to save wap', err)
    res.status(500).send({ err: 'Failed to save wap' })
  }
}

async function removeWap(req, res) {
  try {
    const wapId = req.params.id
    const username = await wapService.remove(wapId)
    const user = await userService.getByUsername(username)
    const miniWapIdx = user.waps.findIndex((currWap) => currWap._id === wapId)
    user.waps.splice(miniWapIdx, 1)
    res.send(user)
  } catch (err) {
    logger.error('Failed to update user', err)
    res.status(500).send({ err: 'Failed to update user' })
  }
}

module.exports = {
  getWap,
  saveWap,
  updateWap,
  removeWap,
}
