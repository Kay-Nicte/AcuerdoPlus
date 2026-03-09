import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';

interface PremiumToastProps {
  visible: boolean;
  onDismiss: () => void;
  onViewPlans: () => void;
}

const PremiumToast: React.FC<PremiumToastProps> = ({ visible, onDismiss, onViewPlans }) => {
  const { t } = useTranslation();

  const FEATURES = [
    t('premiumToast.featureComments'),
    t('premiumToast.featurePatterns'),
    t('premiumToast.featureAuthorizations'),
    t('premiumToast.featurePdf'),
  ];
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.8, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onDismiss}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={28} color={COLORS.warning} />
            </View>

            <Text style={styles.title}>{t('premiumToast.title')}</Text>
            <Text style={styles.subtitle}>{t('premiumToast.subtitle')}</Text>

            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceFrom}>{t('premiumToast.from')}</Text>
              <Text style={styles.price}>{t('premiumToast.price')}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={onViewPlans} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{t('premiumToast.viewPlans')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>{t('premiumToast.notNow')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    zIndex: 999,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  priceFrom: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  price: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: SPACING.sm,
  },
  dismissText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});

export default PremiumToast;
