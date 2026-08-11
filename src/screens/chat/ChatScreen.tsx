import React, { useState, useEffect, useRef } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';
import { ChatMessage } from '../../types';
import MessageBubble from '../../components/chat/MessageBubble';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast, showConfirm } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [muteStatus, setMuteStatus] = useState<{ muted: boolean; mutedUntil: Date | null; mutedForever: boolean }>({ muted: false, mutedUntil: null, mutedForever: false });
  const [memberProfiles, setMemberProfiles] = useState<{ [uid: string]: { displayName: string; showRelation?: boolean; relationToMinor?: string } }>({});
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!currentAgreement) return;
    const loadProfiles = async () => {
      const profiles: typeof memberProfiles = {};
      for (const uid of currentAgreement.members) {
        const u = await authService.getUserData(uid);
        if (u) profiles[uid] = { displayName: u.displayName, showRelation: u.showRelation, relationToMinor: u.relationToMinor };
      }
      setMemberProfiles(profiles);
    };
    loadProfiles();
  }, [currentAgreement]);

  useEffect(() => {
    if (!currentAgreement) return;

    const unsubMessages = chatService.subscribeToMessages(currentAgreement.id, (msgs) => {
      const visible = msgs.filter((m) => !m.hiddenFor?.includes(user?.uid || ''));
      setMessages(visible);
    });

    const unsubLock = chatService.subscribeToChatLock(currentAgreement.id, (locked) => {
      setLockedBy(locked);
    });

    const unsubMute = user
      ? chatService.subscribeToMuteStatus(currentAgreement.id, user.uid, setMuteStatus)
      : undefined;

    return () => {
      unsubMessages();
      unsubLock();
      unsubMute?.();
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
    showConfirm(
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
      showConfirm(
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
      showConfirm(
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

  const handleToggleMute = () => {
    if (!currentAgreement || !user) return;

    if (muteStatus.muted) {
      const untilLabel = muteStatus.mutedForever
        ? t('chat.mutedForever')
        : t('chat.mutedUntil', { date: muteStatus.mutedUntil?.toLocaleString() });

      showConfirm(
        t('chat.unmuteChat'),
        `${untilLabel}\n\n${t('chat.unmuteChatConfirm')}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('chat.unmute'),
            onPress: () => chatService.unmuteChat(currentAgreement.id, user.uid),
          },
        ]
      );
      return;
    }

    showConfirm(
      t('chat.muteChat'),
      t('chat.muteChatDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.mute8h'),
          onPress: () => chatService.muteChat(currentAgreement.id, user.uid, '8h'),
        },
        {
          text: t('chat.mute7d'),
          onPress: () => chatService.muteChat(currentAgreement.id, user.uid, '7d'),
        },
        {
          text: t('chat.muteForever'),
          style: 'destructive',
          onPress: () => chatService.muteChat(currentAgreement.id, user.uid, 'forever'),
        },
      ]
    );
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

      {/* Mute banner */}
      {muteStatus.muted && (
        <View style={styles.lockBanner}>
          <Ionicons name="notifications-off" size={16} color={COLORS.warning} />
          <Text style={styles.lockText}>
            {muteStatus.mutedForever
              ? t('chat.mutedForever')
              : t('chat.mutedUntil', { date: muteStatus.mutedUntil?.toLocaleString() })}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        renderItem={({ item, index }) => {
          const msgDate = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
          const nextItem = messages[index + 1];
          const nextDate = nextItem
            ? (nextItem.timestamp instanceof Date ? nextItem.timestamp : new Date(nextItem.timestamp))
            : null;
          const showDateSep = !nextDate || msgDate.toDateString() !== nextDate.toDateString();

          const todayStr = new Date().toDateString();
          const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
          const dateLabel = msgDate.toDateString() === todayStr
            ? 'Hoy'
            : msgDate.toDateString() === yesterdayStr
              ? 'Ayer'
              : `${msgDate.getDate()}/${msgDate.getMonth() + 1}/${msgDate.getFullYear()}`;

          const displayName = (() => {
            const p = memberProfiles[item.senderUid];
            if (!p) return item.senderName;
            const name = p.displayName;
            return p.showRelation && p.relationToMinor
              ? `${name} (${p.relationToMinor.toLowerCase()})`
              : name;
          })();

          return (
            <>
              <TouchableOpacity onLongPress={() => handleHide(item.id)} activeOpacity={0.7}>
                <MessageBubble message={item} isOwn={item.senderUid === user?.uid} displayName={displayName} />
              </TouchableOpacity>
              {showDateSep && (
                <View style={styles.dateSeparator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateLabel}>{dateLabel}</Text>
                  <View style={styles.dateLine} />
                </View>
              )}
            </>
          );
        }}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity onPress={handleToggleMute} style={styles.lockButton}>
          <Ionicons
            name={muteStatus.muted ? 'notifications-off' : 'notifications-outline'}
            size={20}
            color={muteStatus.muted ? COLORS.warning : COLORS.textMuted}
          />
        </TouchableOpacity>

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
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  lockButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
  },
  lockedInput: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  },
  lockedInputText: {
    fontSize: FONT_SIZES.md, color: COLORS.textMuted, fontStyle: 'italic',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendDisabled: { opacity: 0.5 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginHorizontal: SPACING.sm,
  },
});

export default ChatScreen;
