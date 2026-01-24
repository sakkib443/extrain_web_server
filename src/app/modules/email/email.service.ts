// ===================================================================
// ExtraWeb Backend - Email Service
// Email sending functionality using Nodemailer
// ===================================================================

import nodemailer from 'nodemailer';
import config from '../../config';

// ===================================================================
// TRANSPORTER SETUP
// ===================================================================

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

// ===================================================================
// EMAIL TEMPLATES
// ===================================================================

// Base email template wrapper
const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extrain Web</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    </style>
</head>
<body style="background-color: #f8fafc; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">Extrain Web</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 5px;">Premium IT Solutions & Training</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            ${content}
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Extrain Web. All rights reserved.
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 8px;">
                This email was sent from <a href="${config.frontend_url}" style="color: #14b8a6;">Extrain Web.com</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

// Welcome email template
const getWelcomeEmailTemplate = (firstName: string) => getEmailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 36px;">🎉</span>
        </div>
        <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">Welcome to Extrain Web!</h2>
        <p style="color: #64748b; font-size: 16px;">We're excited to have you on board</p>
    </div>
    
    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${firstName}</strong>,
    </p>
    
    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Thank you for joining Extrain Web! You now have access to our premium collection of website templates and software solutions.
    </p>
    
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h3 style="color: #0369a1; font-size: 16px; margin-bottom: 15px;">✨ What you can do:</h3>
        <ul style="color: #0c4a6e; font-size: 14px; line-height: 2; padding-left: 20px;">
            <li>Browse 500+ premium templates</li>
            <li>Instant download after purchase</li>
            <li>24/7 support available</li>
            <li>Regular updates & new releases</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="${config.frontend_url}/websites" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Browse Templates
        </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
        Need help? Contact us at <a href="mailto:support@Extrain Web.com" style="color: #14b8a6;">support@Extrain Web.com</a>
    </p>
`);

// Purchase invoice email template
interface OrderItem {
    title: string;
    price: number;
    productType?: string;
}

interface InvoiceData {
    firstName: string;
    email: string;
    orderId: string;
    items: OrderItem[];
    totalAmount: number;
    paymentMethod: string;
    transactionId?: string;
    orderDate: Date;
}

const getInvoiceEmailTemplate = (data: InvoiceData) => {
    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 600; color: #1e293b;">${item.title}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${item.productType || 'Website Template'}</div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1e293b; font-weight: 600;">
                ৳${item.price.toLocaleString()}
            </td>
        </tr>
    `).join('');

    return getEmailWrapper(`
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px;">✅</span>
            </div>
            <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">Payment Successful!</h2>
            <p style="color: #64748b; font-size: 16px;">Thank you for your purchase</p>
        </div>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hi <strong>${data.firstName}</strong>,
        </p>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Your order has been confirmed! Here's your invoice:
        </p>
        
        <!-- Invoice Box -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>
                    <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Invoice Number</p>
                    <p style="color: #1e293b; font-weight: 600;">#${data.orderId.slice(-8).toUpperCase()}</p>
                </div>
                <div style="text-align: right;">
                    <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Date</p>
                    <p style="color: #1e293b; font-weight: 600;">${new Date(data.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #e2e8f0;">
                        <th style="padding: 12px 15px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">ITEM</th>
                        <th style="padding: 12px 15px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">PRICE</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <td style="padding: 15px; color: white; font-weight: 600;">Total</td>
                        <td style="padding: 15px; text-align: right; color: white; font-weight: 700; font-size: 18px;">৳${data.totalAmount.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Payment Info -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #166534; font-size: 14px; margin-bottom: 12px;">💳 Payment Details</h3>
            <p style="color: #15803d; font-size: 14px; margin-bottom: 5px;">
                <strong>Method:</strong> ${data.paymentMethod}
            </p>
            ${data.transactionId ? `<p style="color: #15803d; font-size: 14px;"><strong>Transaction ID:</strong> ${data.transactionId}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${config.frontend_url}/dashboard/user/downloads" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Download Now
            </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
            Questions about your order? Contact us at <a href="mailto:support@Extrain Web.com" style="color: #14b8a6;">support@Extrain Web.com</a>
        </p>
    `);
};

// Password reset email template  
const getPasswordResetEmailTemplate = (firstName: string, resetLink: string) => getEmailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 36px;">🔐</span>
        </div>
        <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">Reset Your Password</h2>
        <p style="color: #64748b; font-size: 16px;">We received a password reset request</p>
    </div>
    
    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${firstName}</strong>,
    </p>
    
    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
        </a>
    </div>
    
    <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
            ⏰ This link will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
        </p>
    </div>
    
    <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
    </p>
`);

// ===================================================================
// EMAIL SERVICE
// ===================================================================

const EmailService = {
    // Send welcome email on signup
    async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
        try {
            await transporter.sendMail({
                from: `"Extrain Web" <${config.email.from}>`,
                to: email,
                subject: '🎉 Welcome to Extrain Web - Your Premium Template Journey Begins!',
                html: getWelcomeEmailTemplate(firstName),
            });
            console.log(`✅ Welcome email sent to ${email}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send welcome email:', error);
            return false;
        }
    },

    // Send purchase invoice email
    async sendInvoiceEmail(email: string, invoiceData: InvoiceData): Promise<boolean> {
        try {
            await transporter.sendMail({
                from: `"Extrain Web" <${config.email.from}>`,
                to: email,
                subject: `✅ Payment Confirmed - Order #${invoiceData.orderId.slice(-8).toUpperCase()}`,
                html: getInvoiceEmailTemplate(invoiceData),
            });
            console.log(`✅ Invoice email sent to ${email}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send invoice email:', error);
            return false;
        }
    },

    // Send password reset email
    async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
        try {
            const resetLink = `${config.frontend_url}/reset-password?token=${resetToken}`;
            await transporter.sendMail({
                from: `"Extrain Web" <${config.email.from}>`,
                to: email,
                subject: '🔐 Reset Your Password - Extrain Web',
                html: getPasswordResetEmailTemplate(firstName, resetLink),
            });
            console.log(`✅ Password reset email sent to ${email}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            return false;
        }
    },

    // Verify email configuration
    async verifyConnection(): Promise<boolean> {
        try {
            await transporter.verify();
            console.log('✅ Email service connected successfully');
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    },
};

export default EmailService;
export { InvoiceData, OrderItem };
