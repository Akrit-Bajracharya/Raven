import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePic: {
    type: String,
    default: ""
  },
  interests: {
    type: [String],
    default: []
  },
  interestVector: {
    type: [Number],
    default: []
  },
  onboarded: {
    type: Boolean,
    default: false
  },
  friends: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: []
  },
  // E2EE: public key shared with others to encrypt messages
  publicKey: {
    type: String,
    default: ""
  },
  // E2EE: private key encrypted with user's password, stored for cross-device restore
  encryptedPrivateKey: {
    type: String,
    default: ""
  },
  privateKeySalt: {
    type: String,
    default: ""
  },
  privateKeyIv: {
    type: String,
    default: ""
  },
},
{
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;