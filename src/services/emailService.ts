import nodemailer from "nodemailer";
import logger from "@/lib/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  email: string;
  firstName: string;
  otp: string;
  expiresIn: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, use ethereal email or configure with your email provider
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "test@ethereal.email",
        pass: process.env.SMTP_PASS || "test123",
      },
    });
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      const { email, firstName, otp, expiresIn } = data;

      const subject = "Verify Your MediPort Hub Account";
      const html = this.generateVerificationEmailHTML(
        firstName,
        otp,
        expiresIn
      );
      const text = this.generateVerificationEmailText(
        firstName,
        otp,
        expiresIn
      );

      await this.sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      logger.info(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error("Failed to send verification email:", error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      const subject = "Welcome to MediPort Hub!";
      const html = this.generateWelcomeEmailHTML(firstName);
      const text = this.generateWelcomeEmailText(firstName);

      await this.sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      logger.info(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
      return false;
    }
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: `"MediPort Hub" <${
        process.env.SMTP_FROM || "noreply@mediporthub.com"
      }>`,
      ...options,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private generateVerificationEmailHTML(
    firstName: string,
    otp: string,
    expiresIn: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to MediPort Hub!</h1>
              <p>Verify your account to get started</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thank you for registering with MediPort Hub! To complete your account setup, please use the verification code below:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p><strong>Verification Code</strong></p>
                <p style="color: #666; font-size: 14px;">This code expires in ${expiresIn}</p>
              </div>
              
              <p>Enter this code in the verification modal on our website to complete your registration.</p>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <p>Best regards,<br>The MediPort Hub Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; 2024 MediPort Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateVerificationEmailText(
    firstName: string,
    otp: string,
    expiresIn: string
  ): string {
    return `
Welcome to MediPort Hub!

Hi ${firstName},

Thank you for registering with MediPort Hub! To complete your account setup, please use the verification code below:

Verification Code: ${otp}

This code expires in ${expiresIn}.

Enter this code in the verification modal on our website to complete your registration.

If you didn't create this account, please ignore this email.

Best regards,
The MediPort Hub Team

---
This is an automated message, please do not reply.
© 2024 MediPort Hub. All rights reserved.
    `;
  }

  private generateWelcomeEmailHTML(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to MediPort Hub</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to MediPort Hub!</h1>
              <p>Your account is now verified and ready to use</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Congratulations! Your MediPort Hub account has been successfully verified.</p>
              
              <p>You can now:</p>
              <ul>
                <li>Log in to your account</li>
                <li>Access your dashboard</li>
                <li>Manage your profile</li>
                <li>Use all platform features</li>
              </ul>
              
              <p>Welcome aboard! We're excited to have you as part of our healthcare community.</p>
              
              <p>Best regards,<br>The MediPort Hub Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; 2024 MediPort Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(firstName: string): string {
    return `
Welcome to MediPort Hub!

Hi ${firstName},

Congratulations! Your MediPort Hub account has been successfully verified.

You can now:
- Log in to your account
- Access your dashboard
- Manage your profile
- Use all platform features

Welcome aboard! We're excited to have you as part of our healthcare community.

Best regards,
The MediPort Hub Team

---
This is an automated message, please do not reply.
© 2024 MediPort Hub. All rights reserved.
    `;
  }
}

export const emailService = new EmailService();
