const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { getWap, removeWap, saveWap, updateWap, getSavedWaps, addNewSubscriber, publishWap } = require('./wap.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.get('/', getSavedWaps)
router.get('/:id', getWap)
router.post('/', requireAuth, saveWap)
router.put('/:id', requireAuth, updateWap)
router.put('/:id/newSubscriber', addNewSubscriber)
router.put('/:id/publish', requireAuth, publishWap)
router.delete('/:id', requireAuth, removeWap)

module.exports = router
