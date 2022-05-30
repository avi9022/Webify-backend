const wapService = require('./wap.service')
const userService = require('../user/user.service')
const socketService = require('../../services/socket.service')
const logger = require('../../services/logger.service')

async function getWap(req, res) {
  try {
    const wap = await wapService.getById(req.params.id)
    console.log(wap)
    res.send(wap)
  } catch (err) {
    logger.error('Failed to get wap', err)
    res.status(500).send({ err: 'Failed to get wap' })
  }
}

async function saveWap(req, res) {
  try {
    const wapToSave = await wapService.save(req.body)
    const user = await userService.getUser({ username: wapToSave.ops[0].createdBy })
    const miniWap = {
      _id: wapToSave.ops[0]._id,
      thunmbnail: wapToSave.ops[0].thumbnail,
    }
    user.waps.unshift(miniWap)
    await userService.update(user)
    res.send(wapToSave.ops[0])
  } catch (err) {
    logger.error('Failed to save wap', err)
    res.status(500).send({ err: 'Failed to save wap' })
  }
}

async function updateWap(req, res) {
  try {
    const wapToSave = req.body
    const wapToReturn = await wapService.update(req.params.id, wapToSave)
    const user = await userService.getUser({ username: wapToSave.createdBy })
    const miniWap = {
      _id: wapToSave._id,
      thunmbnail: wapToSave.thumbnail,
    }
    const miniWapIdx = user.waps.findIndex((currWap) => currWap._id === wapToSave._id)
    user.waps.splice(miniWapIdx, 1, miniWap)
    await userService.update(user)
    res.send(wapToReturn)
  } catch (err) {
    logger.error('Failed to save wap', err)
    res.status(500).send({ err: 'Failed to save wap' })
  }
}

async function removeWap(req, res) {
  try {
    const wapId = req.params.id
    const username = await wapService.remove(wapId)
    const user = await userService.getUser({ username })
    const miniWapIdx = user.waps.findIndex((currWap) => currWap._id === wapId)
    user.waps.splice(miniWapIdx, 1)
    await userService.update(user)
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
