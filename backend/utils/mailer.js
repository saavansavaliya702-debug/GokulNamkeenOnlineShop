const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOtpEmail(email, otp) {
  const { data, error } = await resend.emails.send({
    from: "Gokul Namkeen <onboarding@resend.dev>",
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #666; font-size: 16px;">Your OTP verification code is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes.</p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  console.log("📧 OTP email sent:", data.id);
  return data;
}

module.exports = { sendOtpEmail };