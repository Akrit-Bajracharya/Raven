import mongoose from "mongoose"

const userSchema= new mongoose.Schema({
    email:{
    type: String,
    required:true,
    unique: true,
},

    fullname:{
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength:6
    },
    profilePic:{
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
        default:false
    },
    friends: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: []
},
},
{
    timestamps: true,

}
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;