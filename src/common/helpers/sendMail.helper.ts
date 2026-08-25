import { log } from 'console';
import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';
export const sendMail = async (mailOptions: MailOptions) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: `"ARC-Community" <${process.env.EMAIL_USER}>`,
    ...mailOptions,
  });
};
