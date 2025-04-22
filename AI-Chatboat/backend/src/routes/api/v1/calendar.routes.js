const express = require("express");
const {
  getAllData,
  createData,
  updateData,
  deleteData,
  getDataById,
} = require("../../../controller/calendar.controller");
const router = express.Router();

router.post("/createData", createData);
router.get("/getAllData", getAllData);
router.put("/updateData/:id", updateData);
router.delete("/deleteData", deleteData);
router.get("/getDataById/:id", getDataById);

module.exports = router;