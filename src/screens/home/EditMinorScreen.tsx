import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useToast } from '../../context/ToastContext';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { Minor } from '../../types';
import DatePickerField from '../../components/common/DatePickerField';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const EditMinorScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { minorId } = route.params;
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast } = useToast();
  const [minor, setMinor] = useState<Minor | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [economicModel, setEconomicModel] = useState<'fixed' | 'shared' | 'mixed' | ''>('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedPayerUid, setFixedPayerUid] = useState('');
  const [splitA, setSplitA] = useState('50');
  const [members, setMembers] = useState<{ uid: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const MODEL_OPTIONS: { key: 'fixed' | 'shared' | 'mixed'; label: string; desc: string }[] = [
    { key: 'fixed', label: t('models.fixed'), desc: t('models.fixedDesc') },
    { key: 'shared', label: t('models.shared'), desc: t('models.sharedDesc') },
    { key: 'mixed', label: t('models.mixed'), desc: t('models.mixedDesc') },
  ];

  useEffect(() => {
    loadMinor();
    loadMembers();
  }, [minorId]);

  const loadMinor = async () => {
    try {
      const data = await minorService.getMinor(minorId);
      if (data) {
        setMinor(data);
        setName(data.name);
        setBirthDate(data.birthDate ?? null);
        setEconomicModel(data.economicModel || '');
        if (data.fixedAmount) setFixedAmount(String(data.fixedAmount));
        if (data.fixedPayerUid) setFixedPayerUid(data.fixedPayerUid);
        if (data.sharedSplit && currentAgreement && currentAgreement.members.length === 2) {
          const firstUid = currentAgreement.members[0];
          setSplitA(String(data.sharedSplit[firstUid] ?? 50));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!name.trim()) {
      showToast(t('minors.nameRequired'), 'error');
      return;
    }
    if (economicModel === 'fixed' || economicModel === 'mixed') {
      const parsed = Number(fixedAmount.replace(',', '.'));
      if (!fixedAmount || isNaN(parsed) || parsed <= 0) {
        showToast(t('minors.pensionRequired'), 'error');
        return;
      }
      if (!fixedPayerUid && members.length >= 2) {
        showToast(t('minors.selectPayer'), 'error');
        return;
      }
    }
    if (!user || !minor) return;

    // Build shared split
    let sharedSplit: { [uid: string]: number } | undefined;
    if (economicModel === 'shared' || economicModel === 'mixed') {
      if (members.length === 2) {
        sharedSplit = {
          [members[0].uid]: Number(splitA),
          [members[1].uid]: 100 - Number(splitA),
        };
      } else if (members.length === 1) {
        sharedSplit = {
          [members[0].uid]: Number(splitA),
        };
      }
    }

    try {
      setSaving(true);
      await minorService.updateMinor(
        minorId,
        {
          name: name.trim(),
          birthDate: birthDate ?? undefined,
          economicModel: economicModel as 'fixed' | 'shared' | 'mixed' || undefined,
          fixedAmount: (economicModel === 'fixed' || economicModel === 'mixed') ? Number(fixedAmount.replace(',', '.')) : undefined,
          fixedPayerUid: (economicModel === 'fixed' || economicModel === 'mixed') ? fixedPayerUid : undefined,
          sharedSplit,
        },
        user.uid,
        userData?.displayName || 'Usuario'
      );
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!minor) return <Text style={{ padding: SPACING.lg }}>{t('minors.notFound')}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('minors.editMinor')}</Text>

      <Text style={styles.label}>{t('minors.name')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('minors.namePlaceholder')}
        placeholderTextColor={COLORS.textMuted}
      />

      <DatePickerField
        label={t('minors.birthDateOptional')}
        value={birthDate}
        onChange={setBirthDate}
        placeholder={t('common.selectDate')}
      />

      {birthDate && (
        <TouchableOpacity
          style={styles.clearDateButton}
          onPress={() => setBirthDate(null)}
        >
          <Text style={styles.clearDateText}>{t('minors.removeBirthDate')}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>{t('minors.economicModelLabel')}</Text>
      <Text style={styles.hint}>
        {t('minors.economicModelHint', { model: currentAgreement ? { fixed: t('models.fixed'), shared: t('models.shared'), mixed: t('models.mixed') }[currentAgreement.economicModel] : '' })}
      </Text>
      <View style={styles.modelsContainer}>
        {MODEL_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modelCard, economicModel === m.key && styles.modelCardSelected]}
            onPress={() => setEconomicModel(economicModel === m.key ? '' : m.key)}
          >
            <Text style={[styles.modelTitle, economicModel === m.key && styles.modelTitleSelected]}>{m.label}</Text>
            <Text style={[styles.modelDesc, economicModel === m.key && styles.modelDescSelected]}>{m.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campos de pension fija */}
      {(economicModel === 'fixed' || economicModel === 'mixed') && (
        <View style={styles.configSection}>
          <Text style={styles.label}>{t('minors.pensionAmount')}</Text>
          <TextInput
            style={styles.input}
            value={fixedAmount}
            onChangeText={setFixedAmount}
            placeholder="0,00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>{t('minors.whoPays')}</Text>
          <View style={styles.optionsRow}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.uid}
                style={[styles.modelCard, fixedPayerUid === m.uid && styles.modelCardSelected]}
                onPress={() => setFixedPayerUid(m.uid)}
              >
                <Text style={[styles.modelTitle, fixedPayerUid === m.uid && styles.modelTitleSelected]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {members.length < 2 && (
            <Text style={styles.hint}>{t('minors.whoPaysHint')}</Text>
          )}
        </View>
      )}

      {/* Campos de reparto */}
      {(economicModel === 'shared' || economicModel === 'mixed') && (
        <View style={styles.configSection}>
          <Text style={styles.label}>
            {t('minors.expenseSplit', { nameA: members[0]?.name, splitA, nameB: members.length === 2 ? members[1]?.name : t('minors.otherMember'), splitB: 100 - Number(splitA) })}
          </Text>
          <TextInput
            style={styles.input}
            value={splitA}
            onChangeText={setSplitA}
            placeholder="50"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            {t('minors.splitHint', { nameA: members[0]?.name, nameB: members.length === 2 ? members[1]?.name : t('minors.otherMember') })}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? t('common.saving') : t('minors.saveChanges')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textMuted, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text, backgroundColor: COLORS.card },
  clearDateButton: { marginTop: SPACING.sm },
  clearDateText: { color: COLORS.error, fontSize: FONT_SIZES.sm },
  hint: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginBottom: SPACING.sm },
  modelsContainer: { gap: SPACING.sm },
  configSection: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  modelCard: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: SPACING.md,
  },
  modelCardSelected: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryPale,
  },
  modelTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  modelTitleSelected: { color: COLORS.primary },
  modelDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  modelDescSelected: { color: COLORS.primary },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 12, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default EditMinorScreen;
