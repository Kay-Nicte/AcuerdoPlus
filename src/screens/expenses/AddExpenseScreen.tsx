import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useToast } from '../../context/ToastContext';
import { expenseService } from '../../services/expenseService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { Minor } from '../../types';
import ImagePickerButton from '../../components/common/ImagePickerButton';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AddExpenseScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast } = useToast();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [members, setMembers] = useState<{ uid: string; name: string }[]>([]);

  const [selectedMinorId, setSelectedMinorId] = useState('');
  const [type, setType] = useState<'ordinary' | 'extraordinary'>('ordinary');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.uid || '');
  const [splitA, setSplitA] = useState('50');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentAgreement) {
      minorService.getMinors(currentAgreement.id).then(setMinors);
      loadMembers();
    }
  }, [currentAgreement]);

  const loadMembers = async () => {
    if (!currentAgreement) return;
    const list: { uid: string; name: string }[] = [];
    for (const uid of currentAgreement.members) {
      const u = await authService.getUserData(uid);
      list.push({ uid, name: u?.displayName || uid });
    }
    setMembers(list);
  };

  const handleSave = async () => {
    if (!selectedMinorId) { showToast(t('expenses.selectMinor'), 'error'); return; }
    if (!description.trim()) { showToast(t('expenses.descriptionRequired'), 'error'); return; }
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount)) { showToast(t('expenses.invalidAmount'), 'error'); return; }
    if (!currentAgreement || !user) return;

    const splitPercentage: { [uid: string]: number } = {};
    if (members.length === 2) {
      splitPercentage[members[0].uid] = Number(splitA);
      splitPercentage[members[1].uid] = 100 - Number(splitA);
    } else if (members.length === 1) {
      splitPercentage[members[0].uid] = 100;
    }

    try {
      setSaving(true);
      const expense = await expenseService.addExpense({
        agreementId: currentAgreement.id,
        minorId: selectedMinorId,
        type,
        description: description.trim(),
        amount: parsedAmount,
        paidBy,
        paidByName: userData?.displayName || 'Usuario',
        splitPercentage,
        date: new Date(),
      });

      if (receiptUri) {
        await expenseService.uploadReceipt(expense.id, receiptUri, currentAgreement.id);
      }

      navigation.goBack();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('expenses.newExpense')}</Text>

      <Text style={styles.label}>{t('expenses.minor')}</Text>
      {minors.length === 0 ? (
        <View style={styles.noMinorsCard}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning} />
          <Text style={styles.noMinorsText}>
            {t('expenses.registerMinorFirst')}
          </Text>
        </View>
      ) : (
        <View style={styles.optionsRow}>
          {minors.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.option, selectedMinorId === m.id && styles.optionSelected]} onPress={() => setSelectedMinorId(m.id)}>
              <Text style={[styles.optionText, selectedMinorId === m.id && styles.optionTextSelected]}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder={t('expenses.descriptionPlaceholder')} placeholderTextColor={COLORS.textMuted} />

      <Text style={styles.label}>{t('expenses.amount')}</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />

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
          <TextInput style={styles.input} value={splitA} onChangeText={setSplitA} placeholder="50" keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
        </>
      )}

      <View style={{ marginTop: SPACING.md }}>
        <ImagePickerButton onImageSelected={setReceiptUri} label={receiptUri ? t('expenses.receiptAttached') : t('expenses.attachReceipt')} />
      </View>

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? t('common.saving') : t('common.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text, backgroundColor: COLORS.card },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  option: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, backgroundColor: COLORS.card },
  optionSelected: { borderWidth: 0, backgroundColor: COLORS.primary },
  optionText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  optionTextSelected: { color: COLORS.white, fontWeight: '600' },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 12, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  noMinorsCard: {
    flexDirection: 'column', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: 16, backgroundColor: COLORS.warningBg,
    shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  noMinorsText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
});

export default AddExpenseScreen;
