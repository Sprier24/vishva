const express = require("express");
const DealController = require("../../../controller/deal.controller");
const router = express.Router();

router.post("/createDeal", DealController.createDeal);         
router.get("/getAllDeals", DealController.getAllDeals);        
router.put("/updateDeal/:id", DealController.updateDeal);    
router.delete("/deleteDeal/:id", DealController.deleteDeal);   
router.post('/updateDealStatus',DealController.updateStatus);
router.get('/getDealsByStatus', DealController.getDealsByStatus);

module.exports = router;