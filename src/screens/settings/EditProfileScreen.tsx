import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userData, refreshUserData } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [relationToMinor, setRelationToMinor] = useState(userData?.relationToMinor || '');
  const [showRelation, setShowRelation] = useState(userData?.showRelation ?? false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const RELATION_OPTIONS = ['Madre', 'Padre', 'Tutora', 'Tutor', 'Otro'];

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(t('editProfile.galleryPermission'), 'info');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      showToast(t('editProfile.nameRequired'), 'error');
      return;
    }
    if (!user) return;

    try {
      setSaving(true);

      let photoUrl: string | undefined;
      if (photoUri) {
        try {
          const path = `users/${user.uid}/profile_${Date.now()}.jpg`;
          photoUrl = await storageService.uploadFile(path, photoUri);
        } catch (e) {
          console.warn(t('editProfile.photoUploadError'), e);
        }
      }

      await authService.updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        relationToMinor: relationToMinor || undefined,
        showRelation,
        ...(photoUrl ? { photoUrl } : {}),
      });
      await refreshUserData();
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('editProfile.title')}</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickPhoto}>
        {photoUri || userData?.photoUrl ? (
          <Image source={{ uri: photoUri || userData?.photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
        )}
        <View style={styles.avatarBadge}>
          <Ionicons name="camera" size={14} color={COLORS.white} />
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>{t('editProfile.name')}</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('editProfile.namePlaceholder')}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>{t('editProfile.relation')}</Text>
      <View style={styles.optionsRow}>
        {RELATION_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.optionChip, relationToMinor === r && styles.optionChipSelected]}
            onPress={() => setRelationToMinor(relationToMinor === r ? '' : r)}
          >
            <Text style={[styles.optionText, relationToMinor === r && styles.optionTextSelected]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {relationToMinor ? (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('editProfile.showRelation')}</Text>
          <Switch
            value={showRelation}
            onValueChange={setShowRelation}
            trackColor={{ true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? t('common.saving') : t('common.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  avatarContainer: { alignSelf: 'center', marginBottom: SPACING.lg },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text },
  readOnlyField: { backgroundColor: COLORS.backgroundSecondary, borderRadius: 8, padding: SPACING.md },
  readOnlyText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  hint: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  optionChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  optionText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  optionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingVertical: SPACING.sm },
  switchLabel: { fontSize: FONT_SIZES.sm, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default EditProfileScreen;
