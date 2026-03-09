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
      <Text style={styles.title}>{t('expenseBalance.title')}</Text>

      {/* Per-member balance */}
      {entries.map(([uid, amount]) => (
        <View key={uid} style={styles.row}>
          <View style={styles.nameRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.name}>{memberNames[uid] || uid}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              {amount >= 0 ? t('expenseBalance.overpaid') : t('expenseBalance.owes')}
            </Text>
            <Text style={[styles.amount, { color: amount >= 0 ? COLORS.success : COLORS.error }]}>
              {formatCurrency(Math.abs(amount))}
            </Text>
          </View>
        </View>
      ))}

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

      {settled && entries.length > 0 && (
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
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  row: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  name: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
  },
  amountLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  amount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.sm,
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
    backgroundColor: COLORS.success + '10',
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.sm,
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
