const express = require("express");
const authenticate = require('../../../middleware/auth');
const { ServiceController } = require("../../../controller");
const { downloadService, sendCertificateNotification } = require('../../../controller/serviceController');

const router = express.Router();

router.get(
    "/getServices",
    ServiceController.getServices
);
router.post(
    "/generateServices",
    ServiceController.createService
);
router.get(
    "/download/:serviceId",authenticate, downloadService);
router.put(
    "/updateService/:serviceId",
    ServiceController.updateService
);
router.delete(
    "/deleteService/:serviceId",
    ServiceController.deleteService
);
router.get("/getServiceById/:serviceId",ServiceController.getServiceById);

router.post('/sendMail', authenticate, sendCertificateNotification);

module.exports = router;