const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
  query,
  getUser,
  remove,
  update,
  add,
  saveWap,
  deleteWap,
  getById,
}

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy)
  try {
    const collection = await dbService.getCollection('user')
    var users = await collection.find(criteria).toArray()
    users = users.map((user) => {
      delete user.password
      user.createdAt = ObjectId(user._id).getTimestamp()
      // Returning fake fresh data
      // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
      return user
    })
    return users
  } catch (err) {
    logger.error('cannot find users', err)
    throw err
  }
}

async function getById(userId) {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ _id: ObjectId(userId) })
    delete user.password
    return user
  } catch (err) {
    logger.error(`while finding user ${userId}`, err)
    throw err
  }
}
async function getUser(credentials) {
  try {
    console.log('credentials', credentials)
    const collection = await dbService.getCollection('user')
    console.log(collection)
    let user = null
    if (credentials.username) {
      const { username } = credentials
      user = await collection.findOne({ username })
      logger.debug(`auth.service - login with username: ${username}`)
    } else {
      const { email } = credentials
      user = await collection.findOne({ email })
      logger.debug(`auth.service - login with email: ${email}`)
    }
    return user
  } catch (err) {
    // logger.error(`while finding user email ${email}`, err)
    throw err
  }
}

async function remove(userId) {
  try {
    const collection = await dbService.getCollection('user')
    await collection.deleteOne({ _id: ObjectId(userId) })
  } catch (err) {
    logger.error(`cannot remove user ${userId}`, err)
    throw err
  }
}

async function update(user) {
  try {
    // peek only updatable properties
    const userToSave = {
      _id: ObjectId(user._id), // needed for the returnd obj
      waps: user.waps,
    }
    const collection = await dbService.getCollection('user')
    await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
    return userToSave
  } catch (err) {
    logger.error(`cannot update user ${user._id}`, err)
    throw err
  }
}

async function add(user) {
  try {
    // peek only updatable fields!
    const userToAdd = {
      username: user.username,
      email: user.email,
      password: user.password,
      fullname: user.fullname,
      imgUrl: user.imgUrl,
    }
    const collection = await dbService.getCollection('user')
    await collection.insertOne(userToAdd)
    return userToAdd
  } catch (err) {
    logger.error('cannot insert user', err)
    throw err
  }
}

async function saveWap(wap, user) {
  try {
    const existingWapIndex = user.waps.findIndex(
      (currWap) => currWap?._id === wap._id
    )
    if (existingWapIndex > -1) user.waps.splice(existingWapIndex, 1, wap)
    else user.waps.unshift(wap)
    await update(user)
    return user
  } catch (err) {
    logger.err('cannot save wap', err)
    throw err
  }
}

async function deleteWap(wap, user) {
  try {
    const wapIdx = user.waps.findIndex((currWap) => currWap._id === wap._id)
    user.waps.splice(wapIdx, 1)
    await update(user)
    return user
  } catch (err) {
    logger.err('cannot save wap', err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.txt) {
    const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
    criteria.$or = [
      {
        username: txtCriteria,
      },
      {
        fullname: txtCriteria,
      },
    ]
  }
  return criteria
}
