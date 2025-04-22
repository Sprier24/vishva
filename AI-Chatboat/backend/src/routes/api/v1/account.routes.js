const express = require("express");
const accountController = require("../../../controller/account.controller");
const router = express.Router();

router.post("/accountAdd", accountController.accountAdd);
router.put("/updateAccount/:id", accountController.updateAccount);
router.delete("/deleteAccount/:id", accountController.deleteAccount);
router.get("/getAllAccounts", accountController.getAllAccounts); 

module.exports = router;
