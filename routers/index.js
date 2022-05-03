var express = require('express');
var router = express.Router();
const pageController = require('../controllers/pageController');
const signController = require('../controllers/signController');

router.get('/', pageController.home);
router.get('/sign', signController.signWithPdfLib)

module.exports = router;