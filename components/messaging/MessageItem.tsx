import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatHistory } from '../../types/messaging.types';

interface MessageItemProps {
  message: ChatHistory;
  isOwn: boolean;
  previousMessage: ChatHistory | null;
  nextMessage: ChatHistory | null;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  previousMessage,
  nextMessage
}) => {
  // Check if this message should show avatar and name
  const showAvatar = !previousMessage || 
    previousMessage.senderId !== message.senderId ||
    (message.timestamp && previousMessage.timestamp && 
     (message.timestamp.getTime() - previousMessage.timestamp.getTime()) > 300000); // 5 minutes

  const showName = showAvatar && !isOwn;

  // Check if this is the last message in a group
  const isLastInGroup = !nextMessage || 
    nextMessage.senderId !== message.senderId ||
    (message.timestamp && nextMessage.timestamp &&
     (nextMessage.timestamp.getTime() - message.timestamp.getTime()) > 300000); // 5 minutes

  const formatTime = (timestamp: Date | null) => {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDeliveryStatusIcon = () => {
    switch (message.deliveryStatus) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color="#999" />;
      case 'delivered':
        return <Ionicons name="checkmark" size={12} color="#999" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color="#4CAF50" />;
      case 'failed':
        return <Ionicons name="alert-circle-outline" size={12} color="#FF5722" />;
      default:
        return null;
    }
  };

  const shouldShowTimestamp = showAvatar || isLastInGroup;

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      {/* Other person's avatar */}
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {showAvatar ? (
            <Image
              source={{
                uri: message.senderAvatar || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName)}&background=2558B6&color=fff&size=32&format=png`
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
      )}

      {/* Message Content */}
      <View style={[
        styles.messageContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {/* Sender Name (for other people's messages) */}
        {showName && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        {/* Message Bubble */}
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
          message.isDeleted && styles.deletedBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText,
            message.isDeleted && styles.deletedMessageText
          ]}>
            {message.content}
          </Text>

          {/* Timestamp and delivery status for own messages */}
          {shouldShowTimestamp && (
            <View style={[
              styles.messageFooter,
              isOwn ? styles.ownMessageFooter : styles.otherMessageFooter
            ]}>
              <Text style={[
                styles.timestamp,
                isOwn ? styles.ownTimestamp : styles.otherTimestamp
              ]}>
                {formatTime(message.timestamp)}
              </Text>
              {isOwn && !message.isDeleted && (
                <View style={styles.deliveryStatus}>
                  {getDeliveryStatusIcon()}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Read by indicator for group messages */}
        {isOwn && message.readByNames && message.readByNames.length > 0 && (
          <Text style={styles.readBy}>
            Read by {message.readByNames.join(', ')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageContainer: {
    maxWidth: '75%',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: '#FF7345',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deletedBubble: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  deletedMessageText: {
    fontStyle: 'italic',
    color: '#999',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownMessageFooter: {
    justifyContent: 'flex-end',
  },
  otherMessageFooter: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTimestamp: {
    color: '#999',
  },
  deliveryStatus: {
    marginLeft: 4,
    marginTop: 1,
  },
  readBy: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    marginRight: 12,
  },
});

export default MessageItem; 