const nodemailer = require("nodemailer");

const mailSender = async (email, tittle, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure:false,
    });

    let info = await transporter.sendMail({
      from: `"StudyNotion || Alpha" <${process.env.MAIL_USER}>`,
      to: `${email}`,
      subject: `${tittle}`,
      html: `${body}`,
    });
    console.log("Message sent: %s", info);
    return info;
  } catch (error) {
    console.log(error.message);
    return error.message;
  }
};

module.exports = mailSender;
