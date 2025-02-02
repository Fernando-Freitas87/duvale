// backend/routes/login.js

const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Rota para autenticação (por PIN)
router.post('/', loginController.login);


module.exports = router;