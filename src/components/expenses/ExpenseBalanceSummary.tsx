import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';

interface ExpenseBalanceSummaryProps {
  balance: { [uid: string]: number };
  memberNames: { [uid: string]: string };
  debt?: { fromUid: string; toUid: string; amount: number } | null;
  settled?: boolean;
}

const ExpenseBalanceSummary: React.FC<ExpenseBalanceSummaryProps> = ({
  balance,
  memberNames,
  debt,
  settled,
}) => {
  const { t } = useTranslation();
  const entries = Object.entries(balance);

  return (
    <View style={styles.container}>
      {/* Per-member balance — only show cards with non-zero amounts */}
      {entries
        .filter(([, amount]) => Math.abs(amount) > 0.01)
        .map(([uid, amount]) => {
        const isPositive = amount >= 0;
        const iconColor = isPositive ? COLORS.success : COLORS.warning;
        const iconBgColor = isPositive ? COLORS.successBg : COLORS.warningBg;

        return (
          <View key={uid} style={styles.memberCard}>
            <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
              <Ionicons
                name={isPositive ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color={iconColor}
              />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberAmount}>{formatCurrency(Math.abs(amount))}</Text>
              <Text style={styles.memberName}>{memberNames[uid] || uid}</Text>
              <View style={[styles.statusTag, { backgroundColor: isPositive ? COLORS.successBg : COLORS.warningBg }]}>
                <Text style={[styles.statusTagText, { color: isPositive ? COLORS.success : COLORS.warning }]}>
                  {isPositive ? t('expenseBalance.overpaid') : t('expenseBalance.owes')}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Clear debt summary */}
      {debt && !settled && (
        <View style={styles.debtCard}>
          <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
          <Text style={styles.debtText}>
            <Text style={styles.debtName}>{memberNames[debt.fromUid] || debt.fromUid}</Text>
            {` ${t('expenseBalance.owesTo')} `}
            <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
            {` ${t('expenseBalance.toPreposition')} `}
            <Text style={styles.debtName}>{memberNames[debt.toUid] || debt.toUid}</Text>
          </Text>
        </View>
      )}

      {settled && (
        <View style={styles.settledCard}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.settledText}>{t('expenseBalance.settled')}</Text>
        </View>
      )}

      {entries.length === 0 && (
        <Text style={styles.empty}>{t('expenseBalance.noExpenses')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  memberName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusTagText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  debtText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  debtName: {
    fontWeight: '700',
  },
  debtAmount: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  settledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  settledText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '700',
  },
  empty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default ExpenseBalanceSummary;
