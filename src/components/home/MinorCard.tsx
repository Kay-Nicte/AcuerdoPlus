import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Minor } from '../../types';
import { calculateAge, formatDate, isFutureDate } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';

interface MinorCardProps {
  minor: Minor;
  onPress: () => void;
}

const MinorCard: React.FC<MinorCardProps> = ({ minor, onPress }) => {
  const { t } = useTranslation();
  const hasBirthDate = !!minor.birthDate;
  const future = hasBirthDate && isFutureDate(minor.birthDate!);
  const age = hasBirthDate && !future ? calculateAge(minor.birthDate!) : null;

  const detailText = hasBirthDate
    ? future
      ? t('minorCard.expectedBirth', { date: formatDate(minor.birthDate!) })
      : t('minorCard.ageAndBirth', { age, date: formatDate(minor.birthDate!) })
    : t('minorCard.noBirthDate');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{minor.name}</Text>
          <Text style={styles.detail}>
            {detailText}
          </Text>
        </View>
        <View style={[styles.statusBadge, minor.isActive ? styles.active : styles.inactive]}>
          <Text style={[styles.statusText, { color: minor.isActive ? COLORS.success : COLORS.textMuted }]}>
            {minor.isActive ? t('common.active') : t('common.inactive')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  detail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  active: {
    backgroundColor: COLORS.success + '20',
  },
  inactive: {
    backgroundColor: COLORS.border,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});

export default MinorCard;
