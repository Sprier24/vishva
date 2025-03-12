const Users = require("../model/usersSchema.model");

const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await Users.findOne({ googleId: req.user.googleId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      image: user.image,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const logoutUser = (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:3000/");
  });
};

module.exports = {
  getProfile,
  logoutUser,
};
