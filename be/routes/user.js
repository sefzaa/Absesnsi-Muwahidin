const authMiddleware = require("../middleware/auth.middleware.js");
const userController = require("../controllers/user.js");
var router = require("express").Router();

// Endpoint ini akan dilindungi, hanya user yang sudah login yang bisa mengakses
router.post(
    "/change-password",
    [authMiddleware.verifyToken],
    userController.changePassword
);

module.exports = router;
