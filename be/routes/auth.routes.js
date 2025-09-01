// file: routes/auth.routes.js
const authController = require("../controllers/auth.controller.js");
var router = require("express").Router();

// Rute untuk proses login
router.post("/login", authController.login);

module.exports = router;