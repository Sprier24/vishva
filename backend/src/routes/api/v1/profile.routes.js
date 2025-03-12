const express = require("express");
const ProfileController = require("../../../controller/profile.controller");
const router = express.Router();

router.get("/profile", ProfileController.getProfile);
router.get("/logout", ProfileController.logoutUser);

module.exports = router;
