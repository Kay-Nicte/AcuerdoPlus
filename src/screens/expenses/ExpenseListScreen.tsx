import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { expenseService } from '../../services/expenseService';
import { authService } from '../../services/authService';
import { Expense } from '../../types';
import ExpenseCard from '../../components/expenses/ExpenseCard';
import ExpenseBalanceSummary from '../../components/expenses/ExpenseBalanceSummary';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const ExpenseListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentAgreement } = useAgreement();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<{ [uid: string]: number }>({});
  const [debt, setDebt] = useState<{ fromUid: string; toUid: string; amount: number } | null>(null);
  const [settled, setSettled] = useState(false);
  const [memberNames, setMemberNames] = useState<{ [uid: string]: string }>({});
  const [filter, setFilter] = useState<'all' | 'ordinary' | 'extraordinary'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentAgreement) return;
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { type: filter as 'ordinary' | 'extraordinary' } : undefined;
      // Migrar gastos obsoletos que no estaban marcados
      await expenseService.fixObsoleteExpenses(currentAgreement.id);

      const [expenseList, debtResult] = await Promise.all([
        expenseService.getExpenses(currentAgreement.id, filters),
        expenseService.calculateDebt(currentAgreement.id),
      ]);
      setExpenses(expenseList);
      setBalance(debtResult.balances);
      setDebt(debtResult.debt);
      setSettled(debtResult.settled);

      // Load member names
      const names: { [uid: string]: string } = {};
      for (const uid of currentAgreement.members) {
        const userData = await authService.getUserData(uid);
        if (userData) names[uid] = userData.displayName;
      }
      setMemberNames(names);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [currentAgreement, filter]));

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Text style={styles.pageTitle}>{t('expenses.title', 'Gastos')}</Text>
            <ExpenseBalanceSummary balance={balance} memberNames={memberNames} debt={debt} settled={settled} />
            <View style={styles.filters}>
              {(['all', 'ordinary', 'extraordinary'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, filter === f && styles.filterChipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f === 'all' ? t('common.all') : f === 'ordinary' ? t('expenses.ordinaryPlural') : t('expenses.extraordinaryPlural')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message={t('expenses.noExpenses')} icon="receipt-outline" />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  list: { padding: SPACING.md, flexGrow: 1 },
  filters: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  filterText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  filterTextActive: { color: COLORS.white, fontWeight: '600' },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.lg,
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: 'rgba(139,26,58,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  fabText: { color: COLORS.white, fontSize: 26, fontWeight: '300', marginTop: -2 },
});

export default ExpenseListScreen;
