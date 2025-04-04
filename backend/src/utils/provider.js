  require("dotenv").config();
  const passport = require("passport");
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  const Users = require("../model/usersSchema.model");
  const jwt = require("jsonwebtoken");

  // Generate Access Token (expires in 1 hour)
  const generateAccessToken = (id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("Generated Access Token:", token); // ✅ Console logs the token
    return token;
  };


  // Generate Refresh Token (expires in 7 days)
  const generateRefreshToken = (id) => {
    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    console.log("Generated Refresh Token:", refreshToken); // ✅ Console logs the refresh token
    return refreshToken;
  };


  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await Users.findOne({ googleId: profile.id });

          if (!user) {
            user = await Users.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              image: profile.photos?.[0]?.value,
              password: null,
              isFirstLogin: true,
            });
          }

          const isFirstLogin = user.isFirstLogin;

          if (isFirstLogin) {
            user.isFirstLogin = false;
            await user.save();
          }

          // Generate tokens
          const accessToken = generateAccessToken(user._id);
          const refreshToken = generateRefreshToken(user._id);

          // Save refresh token to the database (optional)
          user.refreshToken = refreshToken;
          await user.save();

          const userWithToken = {
            ...user.toObject(),
            accessToken,
            refreshToken,
            isFirstLogin,
          };

          return done(null, userWithToken);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
