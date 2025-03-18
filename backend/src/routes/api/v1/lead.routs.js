const express = require("express");
const LeadController = require("../../../controller/lead.controller");
const router = express.Router();

router.post("/createLead", LeadController.createLead);         
router.get("/getAllLeads", LeadController.getAllLeads);        
router.put("/updateLead/:id", LeadController.updateLead);    
router.delete("/deleteLead/:id", LeadController.deleteLead);   
router.post('/updateLeadStatus',LeadController.updateStatus);
router.get('/getLeadsByStatus', LeadController.getLeadsByStatus);

module.exports = router;
