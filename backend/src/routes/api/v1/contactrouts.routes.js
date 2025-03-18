const express = require('express');
const { contactController } = require('../../../controller');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/createContact', contactController.createContact);
router.put('/updateContact/:id', contactController.updateContact);
router.delete('/deleteContact/:id', contactController.deleteContact);
router.get('/getallContacts', contactController.getAllContacts); 
router.post("/sendEmailContact", upload.array('attachments[]'), contactController.sendEmailContact); 

module.exports = router;
