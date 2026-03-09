import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { minorService } from '../../services/minorService';
import { notificationService } from '../../services/notificationService';
import { Minor, AppNotification } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [activeMinorIndex, setActiveMinorIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);
  const cardWidth = Dimensions.get('window').width - SPACING.lg * 2;

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
    fixed: t('models.fixed'),
    shared: t('models.shared'),
    mixed: t('models.mixed'),
  };

  const custodyLabels: Record<string, string> = {
    shared: t('custodyTypes.shared'),
    majority: t('custodyTypes.majority'),
    exclusive: t('custodyTypes.exclusive'),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t('home.greeting', { name: userData?.displayName })}{userData?.showRelation && userData?.relationToMinor ? ` (${userData.relationToMinor})` : ''}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="person-circle-outline" size={36} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {currentAgreement && minors.length > 0 && (
        <>
          <FlatList
            data={minors}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
              setActiveMinorIndex(index);
            }}
            keyExtractor={(item) => item.id}
            renderItem={({ item: minor }) => {
              const model = minor.economicModel || currentAgreement.economicModel;
              return (
                <TouchableOpacity
                  style={[styles.infoCard, { width: cardWidth }]}
                  onPress={() => navigation.navigate('MinorDetail', { minorId: minor.id })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardTitle}>{t('home.agreementName', { name: minor.name })}</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>{t('home.economicModel')}</Text>
                    <Text style={styles.value}>{modelLabels[model]}</Text>
                  </View>
                  {minor.fixedAmount && (model === 'fixed' || model === 'mixed') && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>{t('home.monthlyPension')}</Text>
                      <Text style={styles.value}>{String(minor.fixedAmount).replace('.', ',')} EUR</Text>
                    </View>
                  )}
                  {currentAgreement.custodyType && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>{t('home.custody')}</Text>
                      <Text style={styles.value}>{custodyLabels[currentAgreement.custodyType]}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>{t('home.approvalMode')}</Text>
                    <Text style={styles.value}>{currentAgreement.approvalMode ? t('common.enabled') : t('common.disabled')}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>{t('home.members')}</Text>
                    <Text style={styles.value}>{currentAgreement.members.length}/2</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          {minors.length > 1 && (
            <View style={styles.dotsContainer}>
              {minors.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeMinorIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </>
      )}

      {currentAgreement && minors.length === 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>{t('home.agreement')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('home.economicModel')}</Text>
            <Text style={styles.value}>{modelLabels[currentAgreement.economicModel]}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('home.members')}</Text>
            <Text style={styles.value}>{currentAgreement.members.length}/2</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.minorsCount', { count: minors.length })}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MinorList')}>
            <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        {minors.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => navigation.navigate('AddMinor')}
          >
            <Text style={styles.emptyText}>{t('home.addFirstMinor')}</Text>
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

      <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AddMinor')}>
          <Ionicons name="person-add-outline" size={24} color={COLORS.primary} style={styles.actionIconStyle} />
          <Text style={styles.actionLabel}>{t('home.addMinor')}</Text>
        </TouchableOpacity>
        {(currentAgreement?.economicModel === 'fixed' || currentAgreement?.economicModel === 'mixed') && (
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MaintenanceList')}>
            <Ionicons name="wallet-outline" size={24} color={COLORS.primary} style={styles.actionIconStyle} />
            <Text style={styles.actionLabel}>{t('home.maintenance')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AuthorizationList')}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} style={styles.actionIconStyle} />
          <Text style={styles.actionLabel}>{t('home.authorizations')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Notifications')}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} style={styles.actionIconStyle} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionLabel}>{t('home.notifications')}</Text>
        </TouchableOpacity>
      </View>

      {recentNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentNotifications')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.seeAll}>{t('common.seeAllFem')}</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileButton: {
    marginLeft: SPACING.sm,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
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
  actionIconStyle: {
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
