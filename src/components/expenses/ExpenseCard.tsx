import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';

interface ExpenseCardProps {
  expense: Expense;
  onPress: () => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onPress }) => {
  const { t } = useTranslation();
  const isObsolete = !!(expense as any).isObsolete;

  return (
    <TouchableOpacity style={[styles.card, isObsolete && styles.cardObsolete]} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.description, isObsolete && styles.textObsolete]}>{expense.description}</Text>
          <Text style={[styles.detail, isObsolete && styles.textObsolete]}>
            {expense.type === 'ordinary' ? t('expenseCard.ordinary') : t('expenseCard.extraordinary')} - {formatDate(expense.date)}
          </Text>
          {isObsolete && (
            <Text style={styles.obsoleteLabel}>{t('expenseCard.corrected')}</Text>
          )}
          {expense.correctedBy && (
            <Text style={styles.correction}>{t('expenseCard.correction')}</Text>
          )}
          {(expense as any).correctionNote && (
            <Text style={styles.correctionNote}>{(expense as any).correctionNote}</Text>
          )}
        </View>
        <Text style={[styles.amount, isObsolete && styles.textObsolete]}>{formatCurrency(expense.amount)}</Text>
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
    marginRight: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  detail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  correction: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: 4,
  },
  cardObsolete: {
    opacity: 0.5,
  },
  textObsolete: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  correctionNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  obsoleteLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 4,
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default ExpenseCard;
