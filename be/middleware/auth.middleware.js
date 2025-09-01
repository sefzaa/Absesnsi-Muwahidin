// file: middleware/auth.middleware.js
// Middleware untuk memverifikasi token JWT
const jwt = require('jsonwebtoken');
const jwtSecret = 'your_secret_key_here'; 

exports.verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'];

    if (!token) {
        return res.status(403).send({ message: 'Token tidak tersedia!' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.user = decoded; // Menyimpan data user dari token di object request
        next();
    });
};