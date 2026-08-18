import { supabase } from '../lib/supabase';
import { emailService } from './emailService';

/**
 * Notification Service
 * 
 * Handles in-app notifications and coordinates with email service
 * for external notifications.
 */

class NotificationService {
  /**
   * Create an in-app notification
   * @param {Object} params - Notification parameters
   * @param {string} params.userId - User ID to notify
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {string} params.type - Notification type (info, success, warning, error)
   * @param {string} params.projectId - Related project ID (optional)
   * @returns {Promise<Object>} - Created notification
   */
  async createNotification({ userId, title, message, type = 'info', projectId = null }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          project_id: projectId,
          read: false,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      // If table doesn't exist, just log and continue
      console.log('Notification (table may not exist yet):', { userId, title, message });
      return { success: false, message: 'Notification table not available' };
    }
  }

  /**
   * Notify carpenter of new project assignment
   * @param {Object} params - Notification parameters
   * @param {string} params.carpenterId - Carpenter user ID
   * @param {string} params.carpenterEmail - Carpenter email
   * @param {string} params.projectTitle - Project title
   * @param {string} params.customerName - Customer name
   * @param {string} params.projectId - Project ID
   * @param {string} params.deliveryDate - Delivery date
   */
  async notifyCarpenterAssignment({ carpenterId, carpenterEmail, projectTitle, customerName, projectId, deliveryDate }) {
    // Create in-app notification
    await this.createNotification({
      userId: carpenterId,
      title: 'New Project Assigned',
      message: `You have been assigned to project: ${projectTitle} for ${customerName}`,
      type: 'info',
      projectId,
    });

    // Send email notification
    await emailService.notifyCarpenterAssignment({
      email: carpenterEmail,
      projectTitle,
      customerName,
      deliveryDate,
    });
  }

  /**
   * Notify cleaner that project is ready for finishing
   * @param {Object} params - Notification parameters
   * @param {string} params.cleanerId - Cleaner user ID
   * @param {string} params.cleanerEmail - Cleaner email
   * @param {string} params.projectTitle - Project title
   * @param {string} params.projectId - Project ID
   */
  async notifyReadyForFinishing({ cleanerId, cleanerEmail, projectTitle, projectId }) {
    // Create in-app notification
    await this.createNotification({
      userId: cleanerId,
      title: 'Project Ready for Finishing',
      message: `Project "${projectTitle}" is ready for finishing work`,
      type: 'info',
      projectId,
    });

    // Send email notification
    await emailService.notifyProductionComplete({
      email: cleanerEmail,
      projectTitle,
    });
  }

  /**
   * Notify assistant that project is ready for delivery
   * @param {Object} params - Notification parameters
   * @param {string} params.assistantId - Assistant user ID
   * @param {string} params.assistantEmail - Assistant email
   * @param {string} params.projectTitle - Project title
   * @param {string} params.projectId - Project ID
   */
  async notifyReadyForDelivery({ assistantId, assistantEmail, projectTitle, projectId }) {
    // Create in-app notification
    await this.createNotification({
      userId: assistantId,
      title: 'Project Ready for Delivery',
      message: `Project "${projectTitle}" is ready for delivery`,
      type: 'success',
      projectId,
    });

    // Send email notification
    await emailService.notifyFinishingComplete({
      email: assistantEmail,
      projectTitle,
    });
  }

  /**
   * Notify customer that project is complete
   * @param {Object} params - Notification parameters
   * @param {string} params.customerEmail - Customer email
   * @param {string} params.projectTitle - Project title
   */
  async notifyProjectComplete({ customerEmail, projectTitle }) {
    // Send email notification to customer
    await emailService.notifyProjectComplete({
      email: customerEmail,
      projectTitle,
    });
  }

  /**
   * Get user's notifications
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Get only unread notifications
   * @returns {Promise<Array>} - User's notifications
   */
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Update result
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Update result
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Unread count
   */
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
