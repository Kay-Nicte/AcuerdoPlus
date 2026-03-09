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
        <View style={[styles.accentBar, isObsolete && styles.accentBarObsolete]} />
        <View style={styles.info}>
          <Text style={[styles.description, isObsolete && styles.textObsolete]}>{expense.description}</Text>
          <Text style={[styles.detail, isObsolete && styles.textObsolete]}>
            {expense.type === 'ordinary' ? t('expenseCard.ordinary') : t('expenseCard.extraordinary')} - {formatDate(expense.date)}
          </Text>
          {isObsolete && (
            <View style={styles.obsoleteTag}>
              <Text style={styles.obsoleteTagText}>{t('expenseCard.corrected')}</Text>
            </View>
          )}
          {expense.correctedBy && (
            <View style={styles.correctionTag}>
              <Text style={styles.correctionTagText}>{t('expenseCard.correction')}</Text>
            </View>
          )}
          {(expense as any).correctionNote && (
            <Text style={styles.correctionNote}>{(expense as any).correctionNote}</Text>
          )}
        </View>
        <Text style={[styles.amount, isObsolete && styles.amountObsolete]}>{formatCurrency(expense.amount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm + 4,
  },
  accentBarObsolete: {
    backgroundColor: COLORS.textLight,
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  description: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  detail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  correctionTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.warningBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  correctionTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  cardObsolete: {
    opacity: 0.4,
  },
  textObsolete: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  amountObsolete: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  correctionNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  obsoleteTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  obsoleteTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
});

export default ExpenseCard;
