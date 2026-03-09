import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { minorService } from '../../services/minorService';
import { notificationService } from '../../services/notificationService';
import { Minor, AppNotification } from '../../types';
import { useSubscription } from '../../context/SubscriptionContext';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
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

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return t('home.goodMorning');
    if (hour >= 13 && hour < 20) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeEyebrow}>{getGreeting()}</Text>
          <Text style={styles.headerName}>
            {userData?.displayName}
            {userData?.showRelation && userData?.relationToMinor ? (
              <Text style={styles.headerRelation}> ({userData.relationToMinor.toLowerCase()})</Text>
            ) : null}
          </Text>
        </View>
        <TouchableOpacity style={styles.avatarColumn} onPress={() => navigation.navigate('Settings')}>
          <View style={styles.avatarRing}>
            <Ionicons name="person-circle-outline" size={44} color={COLORS.primary} />
          </View>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={9} color={COLORS.primary} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Agreement hero card with minors carousel */}
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
                  style={[styles.heroCard, { width: cardWidth }]}
                  onPress={() => navigation.navigate('MinorDetail', { minorId: minor.id })}
                  activeOpacity={0.8}
                >
                  {/* Hero top */}
                  <View style={styles.heroTop}>
                    <View style={styles.heroCircle1} />
                    <View style={styles.heroCircle2} />
                    <View style={styles.heroTopRow}>
                      <Text style={styles.heroMinorName}>{minor.name}</Text>
                      <Text style={styles.heroEyebrow}>{t('home.activeAgreement')}</Text>
                    </View>
                  </View>
                  {/* Hero body */}
                  <View style={styles.heroBody}>
                    <View style={styles.heroRow}>
                      <Text style={styles.heroLabel}>{t('home.economicModel')}</Text>
                      <Text style={styles.heroValue}>{modelLabels[model]}</Text>
                    </View>
                    {(model === 'fixed' || model === 'mixed') && (
                      <View style={styles.heroRow}>
                        <Text style={styles.heroLabel}>{t('home.monthlyPension')}</Text>
                        <Text style={styles.heroValue}>
                          {minor.fixedAmount ? `${String(minor.fixedAmount).replace('.', ',')} EUR` : t('common.unspecified')}
                        </Text>
                      </View>
                    )}
                    {currentAgreement.custodyType && (
                      <View style={styles.heroRow}>
                        <Text style={styles.heroLabel}>{t('home.custody')}</Text>
                        <Text style={styles.heroValue}>{custodyLabels[currentAgreement.custodyType]}</Text>
                      </View>
                    )}
                    <View style={styles.heroRow}>
                      <Text style={styles.heroLabel}>{t('home.approvalMode')}</Text>
                      <View style={[styles.approvalPill, currentAgreement.approvalMode ? styles.approvalPillActive : styles.approvalPillInactive]}>
                        <Text style={[styles.approvalPillText, currentAgreement.approvalMode ? styles.approvalPillTextActive : styles.approvalPillTextInactive]}>
                          {currentAgreement.approvalMode ? t('common.enabled') : t('common.disabled')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.heroRow}>
                      <Text style={styles.heroLabel}>{t('home.members')}</Text>
                      <Text style={styles.heroValue}>{currentAgreement.members.length}/2</Text>
                    </View>
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

      {/* Agreement card without minors */}
      {currentAgreement && minors.length === 0 && (
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>{t('home.agreement')}</Text>
          </View>
          <View style={styles.heroBody}>
            <View style={styles.heroRow}>
              <Text style={styles.heroLabel}>{t('home.economicModel')}</Text>
              <Text style={styles.heroValue}>{modelLabels[currentAgreement.economicModel]}</Text>
            </View>
            <View style={styles.heroRow}>
              <Text style={styles.heroLabel}>{t('home.members')}</Text>
              <Text style={styles.heroValue}>{currentAgreement.members.length}/2</Text>
            </View>
          </View>
        </View>
      )}

      {/* Minors section */}
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
          minors.slice(0, 3).map((minor) => {
            const model = minor.economicModel || currentAgreement?.economicModel;
            return (
              <TouchableOpacity
                key={minor.id}
                style={styles.minorItem}
                onPress={() => navigation.navigate('MinorDetail', { minorId: minor.id })}
              >
                <View style={styles.minorInitialBox}>
                  <Text style={styles.minorInitial}>{getInitial(minor.name)}</Text>
                </View>
                <View style={styles.minorInfo}>
                  <Text style={styles.minorName}>{minor.name}</Text>
                  {model && <Text style={styles.minorSubtitle}>{modelLabels[model]}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AddMinor')}>
          <View style={styles.actionIconBox}>
            <Ionicons name="person-add-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>{t('home.addMinor')}</Text>
        </TouchableOpacity>
        {(currentAgreement?.economicModel === 'fixed' || currentAgreement?.economicModel === 'mixed') && (
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MaintenanceList')}>
            <View style={styles.actionIconBox}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>{t('home.maintenance')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AuthorizationList')}>
          <View style={styles.actionIconBox}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>{t('home.authorizations')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.actionIconBox}>
            <Ionicons name="notifications-outline" size={16} color={COLORS.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionLabel}>{t('home.notifications')}</Text>
        </TouchableOpacity>
      </View>

      {/* Recent notifications */}
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
    paddingBottom: SPACING.sm,
  },
  /* Header */
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeEyebrow: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  headerName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerRelation: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  avatarColumn: {
    alignItems: 'center',
    gap: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryPale,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  /* Hero agreement card */
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 6,
  },
  heroTop: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCircle1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCircle2: {
    position: 'absolute',
    right: 40,
    bottom: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroMinorName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  heroBody: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  heroLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  heroValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  approvalPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  approvalPillActive: {
    backgroundColor: COLORS.successBg,
  },
  approvalPillInactive: {
    backgroundColor: COLORS.primaryPale,
  },
  approvalPillText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  approvalPillTextActive: {
    color: COLORS.success,
  },
  approvalPillTextInactive: {
    color: COLORS.textMuted,
  },
  /* Dots */
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
  /* Section */
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
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  /* Empty */
  emptyCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  emptyText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  /* Minor items */
  minorItem: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  minorInitialBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  minorInitial: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.primary,
  },
  minorInfo: {
    flex: 1,
  },
  minorName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  minorSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  /* Quick actions */
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minWidth: '47%' as any,
    flex: 1,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  /* Badge */
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
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
  /* Notifications */
  notifPreview: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  notifPreviewTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  notifPreviewBody: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});

export default HomeScreen;
