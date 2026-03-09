import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const time = message.timestamp instanceof Date
    ? message.timestamp
    : new Date(message.timestamp);

  const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <Text style={[styles.senderName, isOwn && styles.ownSenderName]}>{message.senderName}</Text>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
          {message.message}
        </Text>
        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
          {timeStr}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
    marginLeft: SPACING.sm,
  },
  ownSenderName: {
    textAlign: 'right',
    marginRight: SPACING.sm,
    marginLeft: 0,
  },
  bubble: {
    borderRadius: 16,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
  },
  ownText: {
    color: COLORS.white,
  },
  otherText: {
    color: COLORS.text,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    textAlign: 'right',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: COLORS.textMuted,
  },
});

export default MessageBubble;
