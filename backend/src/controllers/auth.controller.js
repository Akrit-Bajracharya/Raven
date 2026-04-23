import { sendWelcomeEmail } from "../emails/emailhandler.js";
import cloudinary from "../lib/cloudinary.js";
import { ENV } from "../lib/env.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs"

// Helper to pick the fields we return to the client
function formatUser(user) {
  return {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    profilePic: user.profilePic,
    onboarded: user.onboarded,
    publicKey: user.publicKey || "",
    encryptedPrivateKey: user.encryptedPrivateKey || "",
    privateKeySalt: user.privateKeySalt || "",
    privateKeyIv: user.privateKeyIv || "",
  };
}

export const signup = async (req, res) => {
  const { fullname, email, password } = req.body
  try {
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" })

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new User({ fullname, email, password: hashedPassword });

    if (newUser) {
      const savedUser = await newUser.save();
      generateToken(savedUser._id, res);
      res.status(201).json(formatUser(savedUser));

      try {
        await sendWelcomeEmail(savedUser.email, savedUser.fullname, ENV.CLIENT_URL);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: "Invalid Credentials" })

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid Credentials" })

    generateToken(user._id, res)
    res.status(200).json(formatUser(user));
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" })
  }
};

export const logout = async (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 })
  res.status(200).json({ message: "Logged out successfully" })
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const savePublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ message: "Public key is required" });
    }
    await User.findByIdAndUpdate(req.user._id, { publicKey });
    res.status(200).json({ message: "Public key saved" });
  } catch (error) {
    console.error("Error saving public key:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// NEW: Save the password-encrypted private key backup
export const saveEncryptedPrivateKey = async (req, res) => {
  try {
    const { encryptedPrivateKey, salt, iv } = req.body;
    if (!encryptedPrivateKey || !salt || !iv) {
      return res.status(400).json({ message: "Missing encrypted key data" });
    }
    await User.findByIdAndUpdate(req.user._id, {
      encryptedPrivateKey,
      privateKeySalt: salt,
      privateKeyIv: iv,
    });
    res.status(200).json({ message: "Encrypted private key saved" });
  } catch (error) {
    console.error("Error saving encrypted private key:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};