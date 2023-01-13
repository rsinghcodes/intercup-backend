const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');
const juice = require('juice');
require('dotenv').config();

module.exports = async (name, email, subject, verificationLink) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    const templatePath = path.join(__dirname, '../templates/index.ejs');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const html = ejs.render(template, { name, verificationLink });
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);

    await transporter.sendMail({
      from: {
        name: process.env.APP_NAME,
        address: process.env.USER,
      },
      to: email,
      subject: subject,
      html: htmlWithStylesInlined,
      text: text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.log('Email not sent!');
    console.log(error);
    return error;
  }
};
