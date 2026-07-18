const express = require('express');
const router = express.Router();
const { createCategory, getCategories } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(createCategory).get(getCategories);

module.exports = router;
