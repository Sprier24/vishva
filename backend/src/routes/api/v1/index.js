const express=require("express")
const router = express.Router();
const invoiceRouts=require("./invoice.routs")
const leadRouts=require("./lead.routs")
const taskRouts=require("./task.routs")
const scheduledRouts=require("./scheduled.routs")
const complaintRouts=require("./complaint.routes")
const contactRouts=require("./contactrouts.routes")
const calendarRouts=require("./calendar.routes")
const notificationRoutes = require("./notification.routes")
const usersdRoutes = require("./users.routs")
const ownerRoutes=require("./Owner.routes")
const dealRoutes = require("./deal.routes")
const accountRoutes = require("./account.routes")
const globalRoutes =  require('./search.routes')
const fileFolderRoutes = require("./fileFolder.routes");

router.use("/invoice",invoiceRouts)
router.use("/lead",leadRouts)
router.use("/task",taskRouts)
router.use("/scheduledEvents",scheduledRouts)
router.use("/complaint",complaintRouts)
router.use("/contact",contactRouts)
router.use("/calendar",calendarRouts)
router.use("/notification", notificationRoutes);
router.use("/user", usersdRoutes);
router.use("/owner",ownerRoutes);
router.use('/deal',dealRoutes);
router.use('/account',accountRoutes);
router.use('/search',globalRoutes);
router.use("/file-folder", fileFolderRoutes);

module.exports=router