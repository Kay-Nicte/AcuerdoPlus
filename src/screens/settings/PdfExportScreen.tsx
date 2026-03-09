import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAgreement } from '../../context/AgreementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { pdfExportService } from '../../services/pdfExportService';
import PremiumGate from '../../components/common/PremiumGate';
import DatePickerField from '../../components/common/DatePickerField';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

type Section = 'minors' | 'maintenance' | 'expenses' | 'calendar' | 'chat' | 'history';

const PdfExportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<Section>>(new Set(['minors', 'expenses']));
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [generating, setGenerating] = useState(false);

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'minors', label: t('pdfExport.minors') },
    { key: 'maintenance', label: t('pdfExport.maintenance') },
    { key: 'expenses', label: t('pdfExport.expenses') },
    { key: 'calendar', label: t('pdfExport.calendar') },
    { key: 'chat', label: t('pdfExport.messages') },
    { key: 'history', label: t('pdfExport.history') },
  ];

  if (!isPremium) {
    return (
      <PremiumGate featureName={t('pdfExport.title')} onUpgrade={() => navigation.navigate('Subscription')}>
        <View />
      </PremiumGate>
    );
  }

  const toggleSection = (key: Section) => {
    const newSet = new Set(selected);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelected(newSet);
  };

  const handleExport = async () => {
    if (!currentAgreement) return;
    if (selected.size === 0) {
      showToast(t('pdfExport.selectAtLeastOne'), 'error');
      return;
    }

    try {
      setGenerating(true);
      await pdfExportService.exportPdf(currentAgreement.id, Array.from(selected), { start: startDate, end: endDate });
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('pdfExport.title')}</Text>
      <Text style={styles.subtitle}>{t('pdfExport.subtitle')}</Text>

      {SECTIONS.map((s) => (
        <TouchableOpacity
          key={s.key}
          style={[styles.sectionItem, selected.has(s.key) && styles.sectionSelected]}
          onPress={() => toggleSection(s.key)}
        >
          <View style={[styles.checkbox, selected.has(s.key) && styles.checkboxChecked]}>
            {selected.has(s.key) && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
          </View>
          <Text style={[styles.sectionLabel, selected.has(s.key) && styles.sectionLabelSelected]}>
            {s.label}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>{t('pdfExport.dateRange')}</Text>
      <DatePickerField
        label={t('pdfExport.from')}
        value={startDate}
        onChange={(d) => { setStartDate(d); if (d > endDate) setEndDate(d); }}
        maximumDate={endDate}
        placeholder={t('pdfExport.from')}
      />
      <DatePickerField
        label={t('pdfExport.to')}
        value={endDate}
        onChange={setEndDate}
        minimumDate={startDate}
        maximumDate={new Date()}
        placeholder={t('pdfExport.to')}
      />

      <TouchableOpacity
        style={[styles.button, generating && styles.buttonDisabled]}
        onPress={handleExport}
        disabled={generating}
      >
        <Text style={styles.buttonText}>{generating ? t('common.loading') : t('pdfExport.title')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  sectionItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: SPACING.sm,
  },
  sectionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  checkbox: {
    width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  checkboxChecked: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  sectionLabel: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '600', marginTop: SPACING.lg, marginBottom: SPACING.xs },
  sectionLabelSelected: { fontWeight: '600', color: COLORS.primary },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.lg },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default PdfExportScreen;
