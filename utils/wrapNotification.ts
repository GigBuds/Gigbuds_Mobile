class WrapNotification {
  static wrapNotification(notification: any) {
    return {
      ...notification,
      timestamp: notification.timestamp,
    };
  }
}

export default WrapNotification;