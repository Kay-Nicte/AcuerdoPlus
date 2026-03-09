import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../context/SubscriptionContext';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';

interface PremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
  onUpgrade?: () => void;
}

const PremiumGate: React.FC<PremiumGateProps> = ({ children, featureName, onUpgrade }) => {
  const { t } = useTranslation();
  const { isPremium } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={48} color={COLORS.textMuted} style={styles.icon} />
      <Text style={styles.title}>{t('premiumGate.title')}</Text>
      <Text style={styles.description}>
        {featureName
          ? t('premiumGate.featureMessage', { feature: featureName })
          : t('premiumGate.genericMessage')}
      </Text>
      <Text style={styles.description}>
        {t('premiumGate.upgradeMessage')}
      </Text>
      {onUpgrade && (
        <TouchableOpacity style={styles.button} onPress={onUpgrade}>
          <Text style={styles.buttonText}>{t('premiumGate.viewPlans')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  icon: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default PremiumGate;
