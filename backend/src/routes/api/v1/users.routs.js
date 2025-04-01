const passport = require('passport')
const express = require('express');
const userController = require("../../../controller/user.controller")
const router = express.Router();
require("../../../utils/provider"); 
const authenticateUser = require('../../../middleware/auth');
const {getUser} = require('../../../controller/user.controller')

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/verify-email', userController.verifyEmail);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);
router.post('/logout', userController.logout);
router.delete('/delete-account', userController.deleteAccount);
router.get('/getuser', authenticateUser , getUser);

module.exports = router;