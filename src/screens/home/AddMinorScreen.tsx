import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { minorService } from '../../services/minorService';
import DatePickerField from '../../components/common/DatePickerField';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AddMinorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
  const { showToast, showConfirm } = useToast();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentMinorCount, setCurrentMinorCount] = useState(0);

  useEffect(() => {
    if (currentAgreement) {
      minorService.getMinors(currentAgreement.id).then((list) => {
        setCurrentMinorCount(list.length);
      });
    }
  }, [currentAgreement]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(t('minors.nameRequired'), 'error');
      return;
    }

    if (!isPremium && currentMinorCount >= 1) {
      showConfirm(
        t('minors.freePlanLimit'),
        t('minors.freePlanLimitDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('minors.viewPlans'), onPress: () => navigation.navigate('Ajustes', { screen: 'Subscription' }) },
        ]
      );
      return;
    }

    if (!currentAgreement || !user) return;

    try {
      setSaving(true);
      await minorService.addMinor(
        currentAgreement.id,
        name.trim(),
        birthDate || undefined as any,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('minors.addMinor')}</Text>

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

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? t('common.saving') : t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default AddMinorScreen;
