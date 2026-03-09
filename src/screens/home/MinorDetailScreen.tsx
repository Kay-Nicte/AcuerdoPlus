import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { minorService } from '../../services/minorService';
import { Minor } from '../../types';
import { calculateAge, formatDate, isFutureDate } from '../../utils/formatters';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const MinorDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { minorId } = route.params;
  const { user, userData } = useAuth();
  const { showToast, showConfirm } = useToast();
  const [minor, setMinor] = useState<Minor | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadMinor();
    }, [minorId])
  );

  const loadMinor = async () => {
    try {
      const data = await minorService.getMinor(minorId);
      setMinor(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    showConfirm(
      t('minors.deactivate'),
      t('minors.deactivateConfirm', { name: minor?.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('minors.deactivate'),
          style: 'destructive',
          onPress: async () => {
            try {
              await minorService.deactivateMinor(
                minorId,
                user!.uid,
                userData?.displayName || 'Usuario'
              );
              navigation.goBack();
            } catch (error: any) {
              showToast(error.message, 'error');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (!minor) return <Text style={{ padding: SPACING.lg }}>{t('minors.notFound')}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{minor.name}</Text>

      <View style={styles.infoCard}>
        {minor.birthDate && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>
                {isFutureDate(minor.birthDate) ? t('minors.expectedBirth') : t('minors.birthDate')}
              </Text>
              <Text style={styles.value}>{formatDate(minor.birthDate)}</Text>
            </View>
            {!isFutureDate(minor.birthDate) && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('minors.age')}</Text>
                <Text style={styles.value}>{calculateAge(minor.birthDate)} {t('minors.years')}</Text>
              </View>
            )}
          </>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>{t('minors.status')}</Text>
          <Text style={[styles.value, { color: minor.isActive ? COLORS.success : COLORS.error }]}>
            {minor.isActive ? t('common.active') : t('common.inactive')}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('minors.actions')}</Text>

      {minor.isActive && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('EditMinor', { minorId: minor.id })}
        >
          <Text style={styles.linkText}>{t('minors.editAction')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('MaintenanceList', { minorId: minor.id })}
      >
        <Text style={styles.linkText}>{t('minors.viewMaintenance')}</Text>
      </TouchableOpacity>

      {minor.isActive && (
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeactivate}>
          <Text style={styles.dangerButtonText}>{t('minors.deactivate')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  value: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  linkButton: {
    backgroundColor: COLORS.primaryPale,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: COLORS.error + '10',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default MinorDetailScreen;
