import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const iconMap: Record<AppNotification['entityType'], string> = {
  calendar: '\uD83D\uDCC5',
  chat: '\uD83D\uDCAC',
  maintenance: '\uD83D\uDCB0',
  authorization: '\u2705',
  expense: '\uD83D\uDCCB',
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES');
};

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

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
      Alert.alert('Error', 'No se pudieron marcar como leídas');
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.read && styles.notifUnread]}
      onPress={() => handleTap(item)}
    >
      <Text style={styles.icon}>{iconMap[item.entityType]}</Text>
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
          <Text style={styles.markAllText}>Marcar todas como leídas</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.center : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{'\uD83D\uDD14'}</Text>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySubtitle}>
              Aquí aparecerán las actualizaciones de tu acuerdo
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  notifUnread: {
    backgroundColor: COLORS.primary + '08',
  },
  icon: {
    fontSize: 24,
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
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default NotificationsScreen;
