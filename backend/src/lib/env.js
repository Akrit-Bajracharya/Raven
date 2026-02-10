import "dotenv/config";
export const ENV= {
PORT: process.env.PORT,
MONGO_URI: process.env.MONGO_URI,
JWT_SECRET: process.env.JWT_SECRET,
NODE_ENV: process.env.NODE_ENV,
CLIENT_URL: process.env.CLIENT_URL,
RESEND_API_KEY:process.env.RESEND_API_KEY,
Email_From: process.env.EMAIL_From,
EMAIL_FROM_NAME:process.env.EMAIL_FROM_NAME,
};

// PORT=3000
// MONGO_URI=mongodb+srv://akritbajracharya_db_user:esIsAP9XvNMBvnt9@cluster0.wfyornx.mongodb.net/chatapp?retryWrites=true&w=majority


// NODE_ENV=development

// JWT_SECRET=myjwtsecret

// RESEND_API_KEY=re_W8ZfpgTg_44ZZwUDB2NFpfJCvU1QrWseM

// EMAIL_FROM="onboarding@resend.dev"
// EMAIL_FROM_NAME="Raven App"
// CLIENT_URL=http://localhost:5173