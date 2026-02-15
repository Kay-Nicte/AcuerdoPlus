import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { minorService } from '../../services/minorService';
import { notificationService } from '../../services/notificationService';
import { Minor, AppNotification } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (currentAgreement) {
        loadMinors();
        loadNotifications();
      }
    }, [currentAgreement])
  );

  const loadNotifications = async () => {
    if (!currentAgreement || !userData) return;
    try {
      const count = await notificationService.getUnreadCount(currentAgreement.id, userData.uid);
      setUnreadCount(count);
      const all = await notificationService.getNotifications(currentAgreement.id, userData.uid, 3);
      setRecentNotifications(all.filter((n) => !n.read).slice(0, 3));
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const loadMinors = async () => {
    if (!currentAgreement) return;
    try {
      const list = await minorService.getMinors(currentAgreement.id);
      setMinors(list);
    } catch (error) {
      console.error('Error cargando menores:', error);
    }
  };

  const modelLabels: Record<string, string> = {
    fixed: 'Pensión fija',
    shared: 'Gastos compartidos',
    mixed: 'Mixto',
  };

  const custodyLabels: Record<string, string> = {
    shared: 'Custodia compartida',
    majority: 'Custodia mayoritaria',
    exclusive: 'Custodia exclusiva',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hola, {userData?.displayName}</Text>
      <Text style={styles.subtitle}>Panel de tu acuerdo</Text>

      {currentAgreement && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Acuerdo</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Modelo económico:</Text>
            <Text style={styles.value}>{modelLabels[currentAgreement.economicModel]}</Text>
          </View>
          {currentAgreement.custodyType && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Custodia:</Text>
              <Text style={styles.value}>{custodyLabels[currentAgreement.custodyType]}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Miembros:</Text>
            <Text style={styles.value}>{currentAgreement.members.length}/2</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Modo aprobación:</Text>
            <Text style={styles.value}>{currentAgreement.approvalMode ? 'Activado' : 'Desactivado'}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Menores ({minors.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MinorList')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {minors.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => navigation.navigate('AddMinor')}
          >
            <Text style={styles.emptyText}>Añadir primer menor</Text>
          </TouchableOpacity>
        ) : (
          minors.slice(0, 3).map((minor) => (
            <TouchableOpacity
              key={minor.id}
              style={styles.minorItem}
              onPress={() => navigation.navigate('MinorDetail', { minorId: minor.id })}
            >
              <Text style={styles.minorName}>{minor.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AddMinor')}>
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionLabel}>Añadir menor</Text>
        </TouchableOpacity>
        {(currentAgreement?.economicModel === 'fixed' || currentAgreement?.economicModel === 'mixed') && (
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MaintenanceList')}>
            <Text style={styles.actionIcon}>$</Text>
            <Text style={styles.actionLabel}>Manutención</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AuthorizationList')}>
          <Text style={styles.actionIcon}>{'\u2713'}</Text>
          <Text style={styles.actionLabel}>Autorizaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Notifications')}>
          <View>
            <Text style={styles.actionIcon}>{'\uD83D\uDD14'}</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionLabel}>Notificaciones</Text>
        </TouchableOpacity>
      </View>

      {recentNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notificaciones recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {recentNotifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={styles.notifPreview}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notifPreviewTitle}>{notif.title}</Text>
              <Text style={styles.notifPreviewBody} numberOfLines={1}>{notif.body}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: 60,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  minorItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  minorName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 120,
    flex: 1,
  },
  actionIcon: {
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  notifPreview: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  notifPreviewTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  notifPreviewBody: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

export default HomeScreen;
