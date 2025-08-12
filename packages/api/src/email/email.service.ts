import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: config.get('SMTP_HOST'),
      port: config.get('SMTP_PORT') || 587,
      secure: config.get('SMTP_SECURE') === 'true',
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.config.get('FROM_EMAIL'),
      to: email,
      subject: 'Verify your email address - Scam Dunk',
      html: `
        <h2>Welcome to Scam Dunk!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.config.get('FROM_EMAIL'),
      to: email,
      subject: 'Reset your password - Scam Dunk',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}