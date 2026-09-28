const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #666; font-size: 16px;">Hello,</p>
        <p style="color: #666; font-size: 16px;">Your OTP verification code is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };