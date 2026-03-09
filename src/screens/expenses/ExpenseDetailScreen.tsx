import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { expenseService } from '../../services/expenseService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const ExpenseDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { expenseId } = route.params;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [minorName, setMinorName] = useState('');
  const [paidByName, setPaidByName] = useState('');
  const [splitNames, setSplitNames] = useState<{ name: string; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [expenseId]);

  const loadData = async () => {
    try {
      const data = await expenseService.getExpense(expenseId);
      setExpense(data);
      if (data) {
        const minor = await minorService.getMinor(data.minorId);
        if (minor) setMinorName(minor.name);
        const payer = await authService.getUserData(data.paidBy);
        if (payer) setPaidByName(payer.displayName);

        const splits: { name: string; pct: number }[] = [];
        for (const [uid, pct] of Object.entries(data.splitPercentage)) {
          const u = await authService.getUserData(uid);
          splits.push({ name: u?.displayName || uid, pct });
        }
        setSplitNames(splits);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!expense) return <Text style={{ padding: SPACING.lg }}>{t('expenses.notFound')}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>{expense.description}</Text>
      <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>

      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('expenses.type')}</Text>
          <Text style={styles.value}>{expense.type === 'ordinary' ? t('expenses.ordinary') : t('expenses.extraordinary')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('expenses.minor')}</Text>
          <Text style={styles.value}>{minorName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('expenses.paidBy')}</Text>
          <Text style={styles.value}>{paidByName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('expenses.date')}</Text>
          <Text style={styles.value}>{formatDate(expense.date)}</Text>
        </View>
        {expense.correctedBy && (
          <View style={styles.row}>
            <Text style={styles.label}>{t('expenses.correctsTo')}</Text>
            <Text style={[styles.value, { color: COLORS.warning }]}>{t('expenses.originalExpense')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t('expenses.splitSection')}</Text>
      {splitNames.map((s, i) => (
        <View key={i} style={styles.splitRow}>
          <Text style={styles.splitName}>{s.name}</Text>
          <Text style={styles.splitPct}>{s.pct}% ({formatCurrency(expense.amount * s.pct / 100)})</Text>
        </View>
      ))}

      {expense.receiptUrl && (
        <View style={styles.receiptSection}>
          <Text style={styles.sectionTitle}>{t('expenses.receipt')}</Text>
          <Image source={{ uri: expense.receiptUrl }} style={styles.receiptImage} resizeMode="contain" />
        </View>
      )}

      <TouchableOpacity
        style={styles.correctButton}
        onPress={() => navigation.navigate('ExpenseCorrection', { expenseId: expense.id })}
      >
        <Text style={styles.correctButtonText}>{t('expenses.correctExpense')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  description: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  amount: { fontSize: 36, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.lg, shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  splitName: { fontSize: FONT_SIZES.md, color: COLORS.text },
  splitPct: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  receiptSection: { marginTop: SPACING.lg },
  receiptImage: { width: '100%', height: 200, borderRadius: 16, backgroundColor: COLORS.card },
  correctButton: { backgroundColor: COLORS.warningBg, padding: SPACING.md, borderRadius: 12, alignItems: 'center', marginTop: SPACING.lg },
  correctButtonText: { color: COLORS.warning, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default ExpenseDetailScreen;
