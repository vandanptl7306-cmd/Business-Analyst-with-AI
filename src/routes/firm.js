// src/routes/firm.js

const express = require('express');
const router = express.Router();
const { getFirms, createFirm, updateFirm, setDefaultFirm, deleteFirm } = require('../controllers/firmController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getFirms);
router.post('/', protect, createFirm);
router.put('/:id', protect, updateFirm);
router.put('/:id/default', protect, setDefaultFirm);
router.delete('/:id', protect, deleteFirm);

module.exports = router;
