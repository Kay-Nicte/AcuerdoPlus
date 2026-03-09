import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { expenseService } from '../../services/expenseService';
import { formatDate } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const PLAN_PRICES: Record<string, number> = {
  monthly: 5.99,
  quarterly: 15.99,
  annual: 30.99,
};

const SubscriptionScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { subscription, isPremium, activateSubscription, cancelSubscription } = useSubscription();
  const { showToast, showConfirm } = useToast();
  const [loading, setLoading] = useState(false);
  const [splitPremium, setSplitPremium] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);

  const PLAN_LABELS: Record<string, string> = {
    monthly: t('subscription.monthly'),
    quarterly: t('subscription.quarterly'),
    annual: t('subscription.annual'),
  };

  const handleActivate = async (plan: 'monthly' | 'quarterly' | 'annual') => {
    try {
      setLoading(true);
      await activateSubscription(plan);

      if (splitPremium && currentAgreement && currentAgreement.members.length === 2 && user) {
        const splitPercentage: { [uid: string]: number } = {};
        splitPercentage[currentAgreement.members[0]] = 50;
        splitPercentage[currentAgreement.members[1]] = 50;

        await expenseService.addExpense({
          agreementId: currentAgreement.id,
          minorId: '',
          type: 'ordinary',
          description: `${t('subscription.title')} Premium (${PLAN_LABELS[plan]})`,
          amount: PLAN_PRICES[plan],
          paidBy: user.uid,
          paidByName: userData?.displayName || 'Usuario',
          splitPercentage,
          date: new Date(),
        });
      }

      showToast(t('subscription.activated'), 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    showConfirm(t('subscription.cancelSubscription'), t('subscription.cancelConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('subscription.cancelYes'),
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await cancelSubscription();
            showToast(t('subscription.cancelled'), 'success');
          } catch (error: any) {
            showToast(error.message, 'error');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('subscription.title')}</Text>

      <View style={styles.currentPlan}>
        <Text style={styles.planLabel}>{t('subscription.currentPlan')}</Text>
        <Text style={styles.planName}>{isPremium ? t('common.premium') : t('common.free')}</Text>
        {subscription?.endDate && (
          <Text style={styles.planDate}>{t('subscription.validUntil', { date: formatDate(subscription.endDate) })}</Text>
        )}
      </View>

      {!isPremium && (
        <>
          <Text style={styles.sectionTitle}>{t('subscription.premiumFeatures')}</Text>
          <View style={styles.featureList}>
            {[
              t('subscription.featureAuthorizations'),
              t('subscription.featurePatterns'),
              t('subscription.featurePdf'),
              t('subscription.featureSupport'),
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {currentAgreement && currentAgreement.members.length === 2 && (
            <View style={styles.splitRow}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Text style={styles.splitTitle}>{t('subscription.shareCost')}</Text>
                <Text style={styles.splitSubtitle}>{t('subscription.shareCostDesc')}</Text>
              </View>
              <Switch
                value={splitPremium}
                onValueChange={setSplitPremium}
                trackColor={{ true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('subscription.choosePlan')}</Text>

          <TouchableOpacity
            style={[styles.planCard, loading && styles.disabled]}
            onPress={() => handleActivate('monthly')}
            disabled={loading}
          >
            <Text style={styles.planCardTitle}>{t('subscription.monthly')}</Text>
            <Text style={styles.planCardPrice}>{t('subscription.monthlyPrice')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, loading && styles.disabled]}
            onPress={() => handleActivate('quarterly')}
            disabled={loading}
          >
            <Text style={styles.planCardTitle}>{t('subscription.quarterly')}</Text>
            <Text style={styles.planCardPrice}>{t('subscription.quarterlyPrice')}</Text>
            <Text style={styles.savingsAlt}>{t('subscription.save11')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, styles.planCardHighlight, loading && styles.disabled]}
            onPress={() => handleActivate('annual')}
            disabled={loading}
          >
            <Text style={[styles.planCardTitle, { color: COLORS.white }]}>{t('subscription.annual')}</Text>
            <Text style={[styles.planCardPrice, { color: COLORS.white }]}>{t('subscription.annualPrice')}</Text>
            <Text style={styles.savings}>{t('subscription.save57')}</Text>
          </TouchableOpacity>

          <View style={styles.redeemSection}>
            {!showRedeem ? (
              <TouchableOpacity onPress={() => setShowRedeem(true)}>
                <Text style={styles.redeemLink}>{t('subscription.redeemCode')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.redeemBox}>
                <Text style={styles.redeemLabel}>{t('subscription.redeemLabel')}</Text>
                <TextInput
                  style={styles.redeemInput}
                  value={redeemCode}
                  onChangeText={setRedeemCode}
                  placeholder={t('subscription.redeemPlaceholder')}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.redeemButton, loading && styles.disabled]}
                  disabled={loading}
                  onPress={async () => {
                    if (redeemCode.trim().toUpperCase() === 'ACUERDOPLUSVIP') {
                      try {
                        setLoading(true);
                        await activateSubscription('annual');
                        showToast(t('subscription.redeemSuccess'), 'success');
                        setShowRedeem(false);
                        setRedeemCode('');
                      } catch (error: any) {
                        showToast(error.message, 'error');
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      showToast(t('subscription.redeemInvalid'), 'error');
                    }
                  }}
                >
                  <Text style={styles.redeemButtonText}>{loading ? t('subscription.redeeming') : t('subscription.redeem')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}

      {isPremium && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={loading}>
          <Text style={styles.cancelText}>{t('subscription.cancelSubscription')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  currentPlan: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.lg, alignItems: 'center',
    shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  planLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textMuted },
  planName: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.primary, marginTop: SPACING.xs },
  planDate: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.md, letterSpacing: -0.5 },
  featureList: { marginBottom: SPACING.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs },
  featureCheck: { color: COLORS.success, fontSize: FONT_SIZES.md, marginRight: SPACING.sm, fontWeight: '700' },
  featureText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  planCard: {
    backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, borderRadius: 16, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.md,
    shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  planCardHighlight: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  planCardTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  planCardPrice: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.primary, marginTop: SPACING.xs },
  savings: { fontSize: FONT_SIZES.sm, color: COLORS.white, backgroundColor: COLORS.success, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 8, marginTop: SPACING.sm, overflow: 'hidden' },
  savingsAlt: { fontSize: FONT_SIZES.sm, color: COLORS.success, fontWeight: '600', marginTop: SPACING.sm },
  splitRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: SPACING.md, marginBottom: SPACING.lg,
    shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  splitTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  splitSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  disabled: { opacity: 0.5 },
  redeemSection: { marginTop: SPACING.lg, alignItems: 'center' },
  redeemLink: { color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: '600', textDecorationLine: 'underline' },
  redeemBox: { width: '100%' },
  redeemLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textMuted, marginBottom: SPACING.xs },
  redeemInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text, backgroundColor: COLORS.card, marginBottom: SPACING.sm },
  redeemButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  redeemButtonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  cancelButton: { backgroundColor: 'transparent', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: SPACING.lg },
  cancelText: { color: COLORS.error, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default SubscriptionScreen;
