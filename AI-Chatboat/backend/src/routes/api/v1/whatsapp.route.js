const express = require('express');
const { sendwhatsappmessage } = require('../../../controller/whatsapp.controller');
const router = express.Router();

router.post('/sendmessage', sendwhatsappmessage);

module.exports = router;
