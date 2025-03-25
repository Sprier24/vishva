const express = require("express");
const OwnerController = require("../../../controller/Owner.controller");
const router = express.Router();
const authenticateUser = require('../../../middleware/auth');
const { addOwner } = require('../../../controller/Owner.controller');

router.post('/add-owner', authenticateUser, addOwner);
router.get("/getAllOwners", OwnerController.getOwners);
router.put("/updateOwner/:id",  OwnerController.updateOwner); 
router.delete("/deleteOwner/:id", OwnerController.deleteOwner);
router.get("/count", OwnerController.getOwnerCount);
router.get("/getOwnerForInvoice", OwnerController.getOwnerForInvoice);

module.exports = router;