const {Router} = require('express')

const { authenticated } = require("../../middlewares/auth");
const adminController = require('../../controllers/admin/adminUsers')

router = new Router();

// @desc Get all users Page
// @Route GET /dashboard/users
router.get('/users',authenticated , adminController.getUsers)

// @desc  Get Add User Page
// @Route GET /dashboard/add-user
router.get('/add-user',authenticated , adminController.getAddUser)

// @desc Remove User Page
// @route GET /dashboard/delete-user
router.get('/delete-user/:id',authenticated , adminController.deleteUser)

// @desc Get Edit User Page
// @route Edit User Handle
router.get('/edit-user/:id',authenticated , adminController.getEditUser)

// @desc Dashboard Add Post Handle
// @Route POST /dashboard/add-user
router.post('/add-user',authenticated,adminController.addUser)

// @desc Get Edit User Page
// @route Edit User Handle
router.post('/edit-user/:id',authenticated , adminController.editUser)

module.exports = router