import React, { useState, useEffect, useRef } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { chatService } from '../../services/chatService';
import { ChatMessage } from '../../types';
import MessageBubble from '../../components/chat/MessageBubble';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!currentAgreement) return;

    const unsubMessages = chatService.subscribeToMessages(currentAgreement.id, (msgs) => {
      const visible = msgs.filter((m) => !m.hiddenFor?.includes(user?.uid || ''));
      setMessages(visible);
    });

    const unsubLock = chatService.subscribeToChatLock(currentAgreement.id, (locked) => {
      setLockedBy(locked);
    });

    return () => {
      unsubMessages();
      unsubLock();
    };
  }, [currentAgreement, user]);

  const handleSend = async () => {
    if (!input.trim() || !currentAgreement || !user) return;
    try {
      setSending(true);
      await chatService.sendMessage(
        currentAgreement.id,
        user.uid,
        userData?.displayName || t('chat.defaultUser'),
        input.trim(),
        currentAgreement.members
      );
      setInput('');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleHide = (messageId: string) => {
    if (!user) return;
    Alert.alert(
      t('chat.hideMessage'),
      t('chat.hideMessageConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.hide'),
          onPress: async () => {
            try {
              await chatService.hideMessage(messageId, user.uid);
            } catch (error: any) {
              showToast(error.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleToggleLock = () => {
    if (!currentAgreement || !user) return;

    if (lockedBy) {
      Alert.alert(
        t('chat.unlockChat'),
        t('chat.unlockChatConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('chat.unlock'),
            onPress: () => chatService.unlockChat(currentAgreement.id),
          },
        ]
      );
    } else {
      Alert.alert(
        t('chat.lockChat'),
        t('chat.lockChatConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('chat.lock'),
            style: 'destructive',
            onPress: () => chatService.lockChat(currentAgreement.id, user.uid),
          },
        ]
      );
    }
  };

  const isLocked = !!lockedBy;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Lock banner */}
      {isLocked && (
        <View style={styles.lockBanner}>
          <Ionicons name="lock-closed" size={16} color={COLORS.warning} />
          <Text style={styles.lockText}>
            {lockedBy === user?.uid ? t('chat.chatLockedByYou') : t('chat.chatLocked')}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleHide(item.id)} activeOpacity={0.7}>
            <MessageBubble message={item} isOwn={item.senderUid === user?.uid} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity onPress={handleToggleLock} style={styles.lockButton}>
          <Ionicons
            name={isLocked ? 'lock-closed' : 'lock-open-outline'}
            size={20}
            color={isLocked ? COLORS.warning : COLORS.textMuted}
          />
        </TouchableOpacity>

        {isLocked ? (
          <View style={styles.lockedInput}>
            <Text style={styles.lockedInputText}>{t('chat.chatLocked')}</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || sending) && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  messagesList: { paddingVertical: SPACING.sm },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning + '15',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  lockText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  lockButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  textInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md, color: COLORS.text, maxHeight: 100,
  },
  lockedInput: {
    flex: 1, borderRadius: 20, backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    justifyContent: 'center',
  },
  lockedInputText: {
    fontSize: FONT_SIZES.md, color: COLORS.textMuted, fontStyle: 'italic',
  },
  sendButton: {
    backgroundColor: COLORS.primary, borderRadius: 20,
    width: 38, height: 38,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendDisabled: { opacity: 0.5 },
});

export default ChatScreen;
