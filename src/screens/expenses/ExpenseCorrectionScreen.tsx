import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { expenseService } from '../../services/expenseService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { Expense, Minor } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import LoadingScreen from '../../components/common/LoadingScreen';
import PremiumToast from '../../components/common/PremiumToast';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const ExpenseCorrectionScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { expenseId } = route.params;
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
  const { showToast } = useToast();

  const [original, setOriginal] = useState<Expense | null>(null);
  const [minors, setMinors] = useState<Minor[]>([]);
  const [members, setMembers] = useState<{ uid: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMinorId, setSelectedMinorId] = useState('');
  const [type, setType] = useState<'ordinary' | 'extraordinary'>('ordinary');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitA, setSplitA] = useState('50');
  const [correctionNote, setCorrectionNote] = useState('');
  const [showPremiumToast, setShowPremiumToast] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [expenseId]);

  const loadData = async () => {
    try {
      const exp = await expenseService.getExpense(expenseId);
      setOriginal(exp);
      if (exp && currentAgreement) {
        setSelectedMinorId(exp.minorId);
        setType(exp.type);
        setDescription(exp.description);
        setAmount(String(exp.amount));
        setPaidBy(exp.paidBy);

        const minorsList = await minorService.getMinors(currentAgreement.id);
        setMinors(minorsList);

        const memberList: { uid: string; name: string }[] = [];
        for (const uid of currentAgreement.members) {
          const u = await authService.getUserData(uid);
          memberList.push({ uid, name: u?.displayName || uid });
        }
        setMembers(memberList);

        if (memberList.length === 2 && exp.splitPercentage[memberList[0].uid] !== undefined) {
          setSplitA(String(exp.splitPercentage[memberList[0].uid]));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!description.trim() || !amount || isNaN(parsedAmount) || !currentAgreement || !user) {
      showToast(t('expenses.fillAllFields'), 'error');
      return;
    }

    const splitPercentage: { [uid: string]: number } = {};
    if (members.length === 2) {
      splitPercentage[members[0].uid] = Number(splitA);
      splitPercentage[members[1].uid] = 100 - Number(splitA);
    } else if (members.length === 1) {
      splitPercentage[members[0].uid] = 100;
    }

    try {
      setSaving(true);
      await expenseService.correctExpense(expenseId, {
        agreementId: currentAgreement.id,
        minorId: selectedMinorId,
        type,
        description: description.trim(),
        amount: parsedAmount,
        paidBy,
        paidByName: userData?.displayName || 'Usuario',
        splitPercentage,
        date: new Date(),
        ...(isPremium && correctionNote.trim() ? { correctionNote: correctionNote.trim() } : {}),
      });
      navigation.popToTop();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('expenses.correctExpense')}</Text>

      {original && (
        <View style={styles.originalCard}>
          <Text style={styles.originalLabel}>{t('expenses.originalExpense')}</Text>
          <Text style={styles.originalText}>{original.description} - {formatCurrency(original.amount)}</Text>
        </View>
      )}

      <Text style={styles.label}>{t('expenses.minor')}</Text>
      <View style={styles.optionsRow}>
        {minors.map((m) => (
          <TouchableOpacity key={m.id} style={[styles.option, selectedMinorId === m.id && styles.optionSelected]} onPress={() => setSelectedMinorId(m.id)}>
            <Text style={[styles.optionText, selectedMinorId === m.id && styles.optionTextSelected]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('expenses.type')}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity style={[styles.option, type === 'ordinary' && styles.optionSelected]} onPress={() => setType('ordinary')}>
          <Text style={[styles.optionText, type === 'ordinary' && styles.optionTextSelected]}>{t('expenses.ordinary')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, type === 'extraordinary' && styles.optionSelected]} onPress={() => setType('extraordinary')}>
          <Text style={[styles.optionText, type === 'extraordinary' && styles.optionTextSelected]}>{t('expenses.extraordinary')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('expenses.description')}</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={COLORS.textMuted} />

      <Text style={styles.label}>{t('expenses.amount')}</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />

      <Text style={styles.label}>{t('expenses.paidBy')}</Text>
      <View style={styles.optionsRow}>
        {members.map((m) => (
          <TouchableOpacity key={m.uid} style={[styles.option, paidBy === m.uid && styles.optionSelected]} onPress={() => setPaidBy(m.uid)}>
            <Text style={[styles.optionText, paidBy === m.uid && styles.optionTextSelected]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {members.length === 2 && (
        <>
          <Text style={styles.label}>{t('expenses.split', { nameA: members[0]?.name, splitA, nameB: members[1]?.name, splitB: 100 - Number(splitA) })}</Text>
          <TextInput style={styles.input} value={splitA} onChangeText={setSplitA} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
        </>
      )}

      <Text style={styles.label}>{t('expenses.correctionReasonOptional')}</Text>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (!isPremium) setShowPremiumToast(true);
        }}
      >
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={correctionNote}
          onChangeText={setCorrectionNote}
          placeholder={t('expenses.correctionReasonPlaceholder')}
          placeholderTextColor={COLORS.textMuted}
          multiline
          editable={isPremium}
          pointerEvents={isPremium ? 'auto' : 'none'}
        />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? t('common.saving') : t('expenses.saveCorrection')}</Text>
      </TouchableOpacity>
    </ScrollView>
    <PremiumToast
      visible={showPremiumToast}
      onDismiss={() => setShowPremiumToast(false)}
      onViewPlans={() => { setShowPremiumToast(false); navigation.navigate('Subscription'); }}
      message={t('expenses.premiumCorrectionNote')}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  originalCard: { backgroundColor: COLORS.warning + '15', borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.lg },
  originalLabel: { fontSize: FONT_SIZES.xs, color: COLORS.warning, fontWeight: '600', marginBottom: SPACING.xs },
  originalText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  option: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  optionText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  optionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default ExpenseCorrectionScreen;
