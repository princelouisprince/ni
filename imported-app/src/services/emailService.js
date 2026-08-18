/**
 * Email Service
 * 
 * This service provides a clean abstraction for email functionality.
 * Currently prepared for future integration with email providers like Resend.
 * 
 * To enable email notifications:
 * 1. Install email provider SDK (e.g., npm install resend)
 * 2. Add API key to environment variables
 * 3. Implement the actual sendEmail function
 * 4. Call this service from appropriate places in the application
 */

class EmailService {
  constructor() {
    this.enabled = false; // Set to true when email provider is configured
    this.provider = null; // Will be set when provider is configured (e.g., 'resend')
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (fallback)
   * @returns {Promise<Object>} - Result of email send operation
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.enabled) {
      console.log('Email service not enabled. Email would be sent:', { to, subject });
      return { success: true, message: 'Email service not configured' };
    }

    try {
      // Future implementation with actual email provider
      // Example with Resend:
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // const data = await resend.emails.send({
      //   from: 'Nestia RW <noreply@nestia.rw>',
      //   to,
      //   subject,
      //   html,
      //   text,
      // });
      // return { success: true, data };

      console.log('Email would be sent:', { to, subject });
      return { success: true, message: 'Email queued' };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send project assignment notification to carpenter
   * @param {Object} params - Notification parameters
   * @param {string} params.email - Carpenter's email
   * @param {string} params.projectTitle - Project title
   * @param {string} params.customerName - Customer name
   * @param {string} params.deliveryDate - Delivery date
   */
  async notifyCarpenterAssignment({ email, projectTitle, customerName, deliveryDate }) {
    const subject = `New Project Assigned: ${projectTitle}`;
    const html = `
      <h2>New Project Assignment</h2>
      <p>You have been assigned to a new project:</p>
      <ul>
        <li><strong>Project:</strong> ${projectTitle}</li>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Delivery Date:</strong> ${deliveryDate || 'TBD'}</li>
      </ul>
      <p>Please log in to the workshop management system to view details.</p>
    `;
    const text = `New Project Assignment: ${projectTitle}\nCustomer: ${customerName}\nDelivery Date: ${deliveryDate || 'TBD'}`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send production completion notification
   * @param {Object} params - Notification parameters
   * @param {string} params.email - Cleaner's email
   * @param {string} params.projectTitle - Project title
   */
  async notifyProductionComplete({ email, projectTitle }) {
    const subject = `Project Ready for Finishing: ${projectTitle}`;
    const html = `
      <h2>Project Ready for Finishing</h2>
      <p>The following project is ready for finishing:</p>
      <ul>
        <li><strong>Project:</strong> ${projectTitle}</li>
      </ul>
      <p>Please log in to the workshop management system to begin finishing work.</p>
    `;
    const text = `Project Ready for Finishing: ${projectTitle}`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send finishing completion notification
   * @param {Object} params - Notification parameters
   * @param {string} params.email - Assistant's email
   * @param {string} params.projectTitle - Project title
   */
  async notifyFinishingComplete({ email, projectTitle }) {
    const subject = `Project Ready for Delivery: ${projectTitle}`;
    const html = `
      <h2>Project Ready for Delivery</h2>
      <p>The following project is ready for delivery:</p>
      <ul>
        <li><strong>Project:</strong> ${projectTitle}</li>
      </ul>
      <p>Please coordinate with the customer for delivery arrangements.</p>
    `;
    const text = `Project Ready for Delivery: ${projectTitle}`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send project completion notification
   * @param {Object} params - Notification parameters
   * @param {string} params.email - Customer's email
   * @param {string} params.projectTitle - Project title
   */
  async notifyProjectComplete({ email, projectTitle }) {
    const subject = `Your Furniture is Ready: ${projectTitle}`;
    const html = `
      <h2>Your Furniture is Ready!</h2>
      <p>Your custom furniture project has been completed:</p>
      <ul>
        <li><strong>Project:</strong> ${projectTitle}</li>
      </ul>
      <p>We will contact you shortly to arrange delivery.</p>
      <p>Thank you for choosing Nestia RW!</p>
    `;
    const text = `Your Furniture is Ready!\nProject: ${projectTitle}\n\nThank you for choosing Nestia RW!`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Configure the email service with a provider
   * @param {string} provider - Email provider name (e.g., 'resend')
   * @param {Object} config - Provider configuration
   */
  configure(provider, config) {
    this.provider = provider;
    this.config = config;
    this.enabled = true;
  }
}

// Export singleton instance
export const emailService = new EmailService();
