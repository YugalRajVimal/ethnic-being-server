const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.REACT_APP_GMAIL_USER,
    pass: process.env.REACT_APP_GMAIL_PASS,
  },
});

// Check if email environment variables are set

  console.log(process.env.REACT_APP_GMAIL_USER);
  console.log(process.env.REACT_APP_GMAIL_PASS);
  console.log("INFO: FROM_EMAIL is not set, falling back to GMAIL_USER for 'from' address.");


const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"EthnicBeing" <${process.env.REACT_APP_FROM_EMAIL || process.env.REACT_APP_GMAIL_USER}>`,
    to,
    subject,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${subject}`);
    return info;
  } catch (error) {
    console.log(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

const orderConfirmationHtml = (order, user) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF8F4;padding:32px;border-radius:12px">
    <h1 style="color:#1A1612;font-size:24px">Order Confirmed 🎉</h1>
    <p style="color:#5A5048">Hi ${user.name}, your order <strong>#${order._id}</strong> has been placed successfully.</p>
    <h3 style="color:#C4622D">Order Summary</h3>
    <table style="width:100%;border-collapse:collapse">
      ${order.items.map(i => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #E2D9CE">${i.name} × ${i.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #E2D9CE;text-align:right">Rs. ${(i.price * i.qty).toLocaleString()}</td>
        </tr>
      `).join("")}
      <tr>
        <td style="padding:8px;font-weight:bold">Total</td>
        <td style="padding:8px;font-weight:bold;text-align:right;color:#C4622D">Rs. ${order.total.toLocaleString()}</td>
      </tr>
    </table>
    <p style="color:#8C7B6B;font-size:13px;margin-top:24px">Thank you for shopping with EthnicBeing!</p>
  </div>
`;

const otpHtml = (otp) => `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#FAF8F4;padding:32px;border-radius:12px">
    <h2 style="color:#1A1612">Password Reset OTP</h2>
    <p style="color:#5A5048">Your OTP for password reset is:</p>
    <div style="background:#1A1612;color:#FAF8F4;font-size:32px;font-weight:bold;letter-spacing:10px;padding:20px;text-align:center;border-radius:8px">${otp}</div>
    <p style="color:#8C7B6B;font-size:12px;margin-top:16px">This OTP expires in 10 minutes. Do not share it with anyone.</p>
  </div>
`;

module.exports = { sendEmail, orderConfirmationHtml, otpHtml };
