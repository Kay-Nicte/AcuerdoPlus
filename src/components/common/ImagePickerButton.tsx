import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

interface ImagePickerButtonProps {
  onImageSelected: (uri: string) => void;
  label?: string;
}

const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  onImageSelected,
  label,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showToast(t('imagePicker.galleryPermission'), 'info');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={pickImage}>
      <Text style={styles.buttonText}>{label || t('imagePicker.defaultLabel')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default ImagePickerButton;
