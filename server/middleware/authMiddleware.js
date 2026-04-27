// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    console.log("=== AUTH MIDDLEWARE ===");
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    console.log("AUTH HEADER:", req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    console.log("EXTRACTED TOKEN:", token);

    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DECODED:", decoded);
        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error("JWT ERROR:", err.message); // This will tell us exactly why
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = verifyToken;