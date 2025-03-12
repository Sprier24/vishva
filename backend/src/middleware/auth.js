// const jwt = require('jsonwebtoken')
// // Middleware to authenticate the token and get the user
// const authenticateToken = (req, res, next) => {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//         return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
//         }
//         req.user = decoded; // Attach decoded user info to request
//         next();
//     });
// };

// module.exports={authenticateToken}

const jwt = require("jsonwebtoken");
const User = require("../model/usersSchema.model"); // Assuming you store users in MongoDB

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findOne({ googleId: decoded.googleId });

    if (!req.user) return res.status(401).json({ message: "User not found" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
