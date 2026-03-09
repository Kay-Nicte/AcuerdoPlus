import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useToast } from '../../context/ToastContext';
import { maintenanceService } from '../../services/maintenanceService';
import { minorService } from '../../services/minorService';
import { Minor } from '../../types';
import { formatMonth } from '../../utils/formatters';
import DatePickerField from '../../components/common/DatePickerField';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AddMaintenanceScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast } = useToast();
  const preselectedMinorId = route.params?.minorId;

  const [minors, setMinors] = useState<Minor[]>([]);
  const [selectedMinorId, setSelectedMinorId] = useState(preselectedMinorId || '');
  const [monthDate, setMonthDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentAgreement) {
      minorService.getMinors(currentAgreement.id).then(setMinors);
    }
  }, [currentAgreement]);

  const handleSave = async () => {
    if (!selectedMinorId) { showToast(t('maintenance.selectMinor'), 'error'); return; }
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount)) { showToast(t('maintenance.invalidAmount'), 'error'); return; }
    if (!currentAgreement || !user) return;

    try {
      setSaving(true);
      await maintenanceService.createMaintenance({
        agreementId: currentAgreement.id,
        minorId: selectedMinorId,
        month: formatMonth(monthDate),
        amount: parsedAmount,
        payerUid: user.uid,
        createdByName: userData?.displayName || 'Usuario',
      });
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('maintenance.newMaintenance')}</Text>

      <Text style={styles.label}>{t('maintenance.minor')}</Text>
      <View style={styles.optionsRow}>
        {minors.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.option, selectedMinorId === m.id && styles.optionSelected]}
            onPress={() => setSelectedMinorId(m.id)}
          >
            <Text style={[styles.optionText, selectedMinorId === m.id && styles.optionTextSelected]}>
              {m.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <DatePickerField
        label={t('maintenance.month')}
        value={monthDate}
        onChange={setMonthDate}
        mode="monthYear"
        placeholder={t('maintenance.selectMonth')}
      />

      <Text style={styles.label}>{t('maintenance.amount')}</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? t('common.saving') : t('common.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
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

export default AddMaintenanceScreen;
