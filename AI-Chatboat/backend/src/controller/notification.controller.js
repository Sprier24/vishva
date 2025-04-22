const Notification = require('../model/notificationSchema.model');

const storeNotification = async (notificationData) => {
  try {
    await Notification.create(notificationData);
    console.log('Notification stored successfully');
  } catch (error) {
    console.error('Error storing notification:', error);
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({});
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

module.exports = {
  storeNotification, 
  getAllNotifications,
  deleteNotification,
  deleteAllNotifications,
};

