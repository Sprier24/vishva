// const Users = require('../models/user.model');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new Users({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

        user.refreshToken = refreshToken;
        await user.save();

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) return res.sendStatus(401);

    const user = await Users.findOne({ refreshToken: token });
    if (!user) return res.sendStatus(403);

    jwt.verify(token, process.env.JWT_SECRET, (err) => {
        if (err) return res.sendStatus(403);

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        res.json({ accessToken });
    });
};

// Logout
exports.logout = async (req, res) => {
    const { token } = req.body;
    await Users.updateOne({ refreshToken: token }, { $set: { refreshToken: null } });
    res.sendStatus(204);
};




const Users = require('../model/usersSchema.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require ('validator');
const nodemailer = require("nodemailer");

const createToken = (id) =>{
    return jwt.sign({id},process.env.JWT_SECRET)
}


const register = async (req, res) => {
    const { name, email, password } = req.body;
  
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please provide all necessary fields.',
      });
    }
  
    try {
      const exists = await Users.findOne({ email });
      if (exists) {
        return res.json({ success: false, message: "User Already Exists" });
      }
  
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Please Enter a valid Email" });
      }
  
      // Password validation
      if (password.length < 6) {
        return res.json({ success: false, message: "Password must be at least 6 characters" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const user = new Users({ name, email, password: hashedPassword, verificationCode });
      await user.save();
  
      // Send the verification email
      await sendVerificationCode(email, verificationCode);
  
      res.json({
        success: true,
        message: 'Registration successful. Please verify your email.',
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
  

const login = async (req, res) => {
    const { email, password } = req.body; // Expect token in the body

    try {
        // Step 1: Check if the user exists in the database
        const user = await Users.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exist" });
        }

        // Step 2: Verify the password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        
        // Step 4: If no token is provided, generate a new token
        const newToken = createToken(user._id);

        return res.json({ success: true, message: "Login successful", token: newToken });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Initialize Nodemailer with hardcoded email ID and app password
const transporter = nodemailer.createTransport({
    service: "gmail",  // Or another service like SendGrid
    auth: {
      user: "purvagalani@gmail.com",  // Replace with your Gmail ID
        pass: "tefl tsvl dxuo toch",   // Replace with your Gmail App Password
    },
});
const verifyEmail = async (req, res) => {
  const { verificationCode } = req.body; // Only verificationCode required

  try {
      // Find the user with the provided verification code
      const user = await Users.findOne({ verificationCode });

      if (!user) {
          return res.status(400).json({ success: false, message: 'Invalid verification code' });
      }

      // Mark user as verified
      user.isVerified = true;
      user.verificationCode = null; // Clear the code after successful verification
      await user.save();

      return res.status(200).json({ success: true, message: 'Email successfully verified' });
  } catch (error) {
      console.error("Verification error:", error);
      return res.status(500).json({ success: false, message: 'Server error' });
  }
};



const sendVerificationCode = async (email, verificationCode) => {
    try {
      const response = await transporter.sendMail({
        from: '"Verification Team" <your_email@example.com>', // Replace with your sender email
        to: email, // Receiver's email
        subject: "Email Verification Code", // Email subject
        text: `Your verification code is ${verificationCode}`, // Plain text body
        html: `<p>Your verification code is <b>${verificationCode}</b></p>`, // HTML body
      });
  
      console.log('Verification email sent successfully:', response);
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
    }
  };
  
  // Forgot Password Functionality
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
      // Check if user exists
      const user = await Users.findOne({ email });
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      // Generate a reset token valid for 1 hour
      const token = createToken(user._id, { expiresIn: '1h' });

      // Save the token and expiration to the user object
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
      await user.save();

      // Construct the reset URL
      const resetLink = `http://localhost:3000/Resetpassword`;

      // Send email to the user
      await transporter.sendMail({
          from: process.env.EMAIL,
          to: email,
          subject: "Password Reset Request",
          html: `
              <h4>Password Reset Request</h4>
              <p>Click the link below to reset your password. This link will expire in 1 hour:</p>
              <a href="${resetLink}" target="_blank">${resetLink}</a>
          `,
      });

      res.json({ success: true, message: "Password reset link sent to your email" });
  } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset Password Functionality
const resetPassword = async (req, res) => {
  const { token } = req.params; // Get token from URL
  const { password } = req.body; // Get new password from request body

  try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user with the token and ensure the token has not expired
      const user = await Users.findOne({
          _id: decoded.id,
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() }, // Ensure the token is still valid
      });

      if (!user) {
          return res.status(400).json({ success: false, message: "Invalid or expired token" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password and remove the token fields
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      console.error("Reset Password Error:", error);
      if (error.name === 'TokenExpiredError') {
          return res.status(400).json({ success: false, message: "Reset link has expired" });
      }
      res.status(500).json({ success: false, message: "Server error" });
  }
};
// Login
// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const user = await Users.findOne({ email });

//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1hr'});
//         const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1hr' });

//         user.refreshToken = refreshToken;
//         await user.save();

//         res.json({ accessToken, refreshToken });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Refresh Token
// exports.refreshToken = async (req, res) => {
//     const { token } = req.body;

//     if (!token) return res.sendStatus(401);

//     const user = await Users.findOne({ refreshToken: token });
//     if (!user) return res.sendStatus(403);

//     jwt.verify(token, process.env.JWT_SECRET, (err) => {
//         if (err) return res.sendStatus(403);

//         const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
//         res.json({ accessToken });
//     });
// };

// Logout
// exports.logout = async (req, res) => {
//     const { token } = req.body;
//     await Users.updateOne({ refreshToken: token }, { $set: { refreshToken: null } });
//     res.sendStatus(204);
// };

module.exports = {register,login,verifyEmail,sendVerificationCode,forgotPassword,resetPassword}