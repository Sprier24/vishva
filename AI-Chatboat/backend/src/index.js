require('dotenv').config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer'); 
const path = require('path'); 
const routes = require("./routes/api/v1/index");
const connectDB = require("./db/mongoosedb");
const cors = require('cors');
const { storeNotification } = require('./controller/notification.controller');

connectDB();

const app = express();
app.use('/uploads', express.static(path.join(__dirname)));
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/v1", routes);
app.get("/", (req, res) => res.send("Home Page"));
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const { isFirstLogin, token, email } = req.user;

    const redirectTo = isFirstLogin
      ? `http://localhost:3000/Profile`
      : `http://localhost:3000/Dashboard`;

    res.redirect(redirectTo);
  }
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.on('notify', async (notificationData) => {
    try {
      await storeNotification(notificationData);
      socket.emit('notification-saved', { success: true });
      io.emit('notification', notificationData);
    } catch (error) {
      console.error('Error storing notification:', error);
      socket.emit('notification-saved', { success: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
  });
});

io.engine.on('connection_error', (err) => {
  console.error('Socket.IO Connection error:', err);
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = io;
