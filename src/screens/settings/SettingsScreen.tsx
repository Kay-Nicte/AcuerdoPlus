import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, StyleSheet, ScrollView, Image, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { agreementService } from '../../services/agreementService';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import PremiumToast from '../../components/common/PremiumToast';
import { getStoredLanguage, setStoredLanguage } from '../../i18n';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen: string;
  premium?: boolean;
  color?: string;
};

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { userData, signOut, deactivateAccount } = useAuth();
  const { currentAgreement, refreshAgreement } = useAgreement();
  const { isPremium } = useSubscription();
  const { showToast } = useToast();

  const [showPremiumToast, setShowPremiumToast] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    getStoredLanguage().then((lang) => setSelectedLanguage(lang));
  }, []);

  const handleLanguageChange = async (lang: string | null) => {
    setSelectedLanguage(lang);
    await setStoredLanguage(lang);
    if (lang) {
      i18next.changeLanguage(lang);
    } else {
      // System default
      const Localization = require('expo-localization');
      const locale = Localization.getLocales()?.[0]?.languageCode ?? 'en';
      i18next.changeLanguage(locale === 'es' ? 'es' : 'en');
    }
  };

  const handleInvite = async () => {
    if (!currentAgreement) return;
    try {
      const code = await agreementService.getInviteCode(currentAgreement.id);
      if (!code) {
        showToast(t('settings.inviteCodeNotFound'), 'error');
        return;
      }
      Alert.alert(
        t('settings.inviteMember'),
        t('settings.shareCode', { code }),
        [
          {
            text: t('settings.copy'),
            onPress: async () => {
              await Clipboard.setStringAsync(code);
              showToast(t('settings.codeCopied'), 'success');
            },
          },
          {
            text: t('settings.share'),
            onPress: () => {
              Share.share({
                message: t('settings.shareMessage', { code }),
              });
            },
          },
          { text: t('common.close'), style: 'cancel' },
        ]
      );
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleToggleApproval = async (value: boolean) => {
    if (!currentAgreement) return;
    if (value && !isPremium) {
      setShowPremiumToast(true);
      return;
    }
    try {
      await agreementService.toggleApprovalMode(currentAgreement.id, value);
      await refreshAgreement();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: signOut },
    ]);
  };

  const modelLabels: Record<string, string> = {
    fixed: t('models.fixed'),
    shared: t('models.shared'),
    mixed: t('models.mixed'),
  };

  const menuItems: MenuItem[] = [
    { icon: 'time-outline', label: t('settings.history'), screen: 'History' },
    { icon: 'card-outline', label: t('settings.subscription'), screen: 'Subscription', color: COLORS.primary },
    { icon: 'shield-checkmark-outline', label: t('settings.authorizations'), screen: 'AuthorizationList', premium: true },
    { icon: 'document-text-outline', label: t('settings.exportPdf'), screen: 'PdfExport', premium: true },
  ];

  const languageOptions: { label: string; value: string | null }[] = [
    { label: t('settings.system'), value: null },
    { label: t('settings.spanish'), value: 'es' },
    { label: t('settings.english'), value: 'en' },
  ];

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Profile section */}
      <View style={styles.profileCard}>
        {userData?.photoUrl ? (
          <Image source={{ uri: userData.photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={COLORS.white} />
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {userData?.displayName}
            {userData?.showRelation && userData?.relationToMinor ? ` (${userData.relationToMinor})` : ''}
          </Text>
          <Text style={styles.profileEmail}>{userData?.email}</Text>
          <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
            <Ionicons name={isPremium ? 'star' : 'star-outline'} size={12} color={isPremium ? COLORS.white : COLORS.textMuted} />
            <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPremium]}>
              {isPremium ? t('common.premium') : t('common.free')}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Agreement section */}
      {currentAgreement && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.agreement')}</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.label}>{t('settings.economicModel')}</Text>
              </View>
              <Text style={styles.value}>{modelLabels[currentAgreement.economicModel]}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="people-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.label}>{t('settings.members')}</Text>
              </View>
              <Text style={styles.value}>{currentAgreement.members.length}/2</Text>
            </View>
            {currentAgreement.members.length < 2 && (
              <TouchableOpacity style={styles.inviteRow} onPress={handleInvite}>
                <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                <Text style={styles.inviteText}>{t('settings.inviteMember')}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.label}>{t('settings.approvalMode')}</Text>
              </View>
              <Switch
                value={currentAgreement.approvalMode}
                onValueChange={handleToggleApproval}
                trackColor={{ true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>
      )}

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.options')}</Text>
        <View style={styles.card}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={20} color={item.color || COLORS.text} />
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.premium && !isPremium && (
                  <View style={styles.premiumTag}>
                    <Text style={styles.premiumTagText}>{t('common.premium')}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          {languageOptions.map((option, index) => {
            const isSelected = selectedLanguage === option.value;
            return (
              <TouchableOpacity
                key={option.label}
                style={[styles.menuItem, index === languageOptions.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => handleLanguageChange(option.value)}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.menuText, isSelected && { color: COLORS.primary, fontWeight: '600' }]}>{option.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deactivateButton}
        onPress={() => {
          Alert.alert(
            t('settings.deactivateAccount'),
            t('settings.deactivateAccount'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('settings.deactivateAccount'),
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deactivateAccount();
                  } catch (error: any) {
                    showToast(error.message, 'error');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.deactivateText}>{t('settings.deactivateAccount')}</Text>
      </TouchableOpacity>
    </ScrollView>
    <PremiumToast
      visible={showPremiumToast}
      onDismiss={() => setShowPremiumToast(false)}
      onViewPlans={() => { setShowPremiumToast(false); navigation.navigate('Subscription'); }}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  editLink: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.lg,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  avatarImage: {
    width: 52, height: 52, borderRadius: 26, marginRight: SPACING.md,
  },
  profileInfo: { flex: 1, marginRight: SPACING.sm },
  editButton: { padding: SPACING.xs },
  profileName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  profileEmail: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary, borderRadius: 12,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: SPACING.xs, gap: 4,
  },
  planBadgePremium: { backgroundColor: COLORS.primary },
  planBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  planBadgeTextPremium: { color: COLORS.white },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  inviteRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.primary + '08',
  },
  inviteText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  menuText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  premiumTag: {
    backgroundColor: COLORS.primary + '15', borderRadius: 8,
    paddingHorizontal: SPACING.xs, paddingVertical: 2,
  },
  premiumTagText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.error + '10', padding: SPACING.md, borderRadius: 8,
    marginTop: SPACING.md,
  },
  logoutText: { color: COLORS.error, fontSize: FONT_SIZES.md, fontWeight: '600' },
  deactivateButton: {
    padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.sm,
  },
  deactivateText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
});

export default SettingsScreen;
