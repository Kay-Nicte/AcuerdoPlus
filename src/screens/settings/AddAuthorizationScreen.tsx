import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { useToast } from '../../context/ToastContext';
import { authorizationService } from '../../services/authorizationService';
import { minorService } from '../../services/minorService';
import { Minor } from '../../types';
import ImagePickerButton from '../../components/common/ImagePickerButton';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AddAuthorizationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { showToast } = useToast();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [selectedMinorId, setSelectedMinorId] = useState('');
  const [activity, setActivity] = useState('');
  const [description, setDescription] = useState('');
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentAgreement) {
      minorService.getMinors(currentAgreement.id).then(setMinors);
    }
  }, [currentAgreement]);

  const handleSave = async () => {
    if (!selectedMinorId) { showToast(t('authz.selectMinor'), 'error'); return; }
    if (!activity.trim()) { showToast(t('authz.activityRequired'), 'error'); return; }
    if (!currentAgreement || !user) return;

    try {
      setSaving(true);
      const auth = await authorizationService.createAuthorization({
        agreementId: currentAgreement.id,
        minorId: selectedMinorId,
        activity: activity.trim(),
        description: description.trim(),
        memberUids: currentAgreement.members,
        createdBy: user.uid,
        createdByName: userData?.displayName || 'Usuario',
      });

      if (documentUri) {
        await authorizationService.uploadDocument(auth.id, documentUri, currentAgreement.id);
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
      <Text style={styles.title}>{t('authz.newAuthorization')}</Text>

      <Text style={styles.label}>{t('authz.minor')}</Text>
      <View style={styles.optionsRow}>
        {minors.map((m) => (
          <TouchableOpacity key={m.id} style={[styles.option, selectedMinorId === m.id && styles.optionSelected]} onPress={() => setSelectedMinorId(m.id)}>
            <Text style={[styles.optionText, selectedMinorId === m.id && styles.optionTextSelected]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('authz.activity')}</Text>
      <TextInput style={styles.input} value={activity} onChangeText={setActivity} placeholder={t('authz.activityPlaceholder')} placeholderTextColor={COLORS.textMuted} />

      <Text style={styles.label}>{t('authz.description')}</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('authz.description')}
        placeholderTextColor={COLORS.textMuted}
        multiline
        textAlignVertical="top"
      />

      <View style={{ marginTop: SPACING.md }}>
        <ImagePickerButton
          onImageSelected={setDocumentUri}
          label={documentUri ? t('authz.description') : t('authz.description')}
        />
      </View>

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? t('common.saving') : t('authz.newAuthorization')}</Text>
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

export default AddAuthorizationScreen;
