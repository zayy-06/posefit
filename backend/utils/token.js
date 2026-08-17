const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const generateToken = (userId, role) => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "1d",
    }
  );
};

module.exports = generateToken;