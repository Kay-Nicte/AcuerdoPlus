import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useToast } from '../../context/ToastContext';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const iconMap: Record<AppNotification['entityType'], keyof typeof Ionicons.glyphMap> = {
  calendar: 'calendar',
  chat: 'chatbubbles',
  maintenance: 'wallet',
  authorization: 'shield-checkmark',
  expense: 'receipt',
};

// formatTimeAgo is now inside the component to access t()

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t('notif.now');
    if (diffMin < 60) return t('notif.minutesAgo', { count: diffMin });
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t('notif.hoursAgo', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return t('notif.daysAgo', { count: diffDays });
    return date.toLocaleDateString('es-ES');
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [currentAgreement, userData])
  );

  const loadNotifications = async () => {
    if (!currentAgreement || !userData) return;
    try {
      setLoading(true);
      const list = await notificationService.getNotifications(
        currentAgreement.id,
        userData.uid
      );
      setNotifications(list);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTap = async (notif: AppNotification) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }

    switch (notif.entityType) {
      case 'calendar':
        // Navigate to calendar tab
        navigation.getParent()?.navigate('Calendar');
        break;
      case 'chat':
        navigation.getParent()?.navigate('Chat');
        break;
      case 'maintenance':
        navigation.navigate('MaintenanceDetail', { maintenanceId: notif.entityId });
        break;
      case 'authorization':
        navigation.navigate('AuthorizationDetail', { authorizationId: notif.entityId });
        break;
      case 'expense':
        navigation.getParent()?.navigate('Expenses');
        break;
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentAgreement || !userData) return;
    try {
      await notificationService.markAllAsRead(currentAgreement.id, userData.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      showToast('No se pudieron marcar como leídas', 'error');
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.read && styles.notifUnread]}
      onPress={() => handleTap(item)}
    >
      <Ionicons name={iconMap[item.entityType]} size={24} color={COLORS.primary} style={styles.iconStyle} />
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasUnread && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>{t('notif.markAllRead')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.center : { paddingBottom: 100, paddingTop: SPACING.sm }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>{t('notif.empty')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('notif.emptyDesc')}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllBtn: {
    padding: SPACING.md,
    alignItems: 'flex-end',
  },
  markAllText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  notifUnread: {
    backgroundColor: COLORS.primaryPale,
  },
  iconStyle: {
    marginRight: SPACING.md,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: 2,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifBody: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default NotificationsScreen;
