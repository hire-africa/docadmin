import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'DocAvailable'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('✉️ Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error };
    }
}
