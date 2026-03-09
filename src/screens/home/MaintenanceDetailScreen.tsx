import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { maintenanceService } from '../../services/maintenanceService';
import { minorService } from '../../services/minorService';
import { Maintenance } from '../../types';
import { formatCurrency, formatMonthLabel } from '../../utils/formatters';
import ImagePickerButton from '../../components/common/ImagePickerButton';
import ApprovalBadge from '../../components/common/ApprovalBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const MaintenanceDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route }) => {
  const { t } = useTranslation();
  const { maintenanceId } = route.params;
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [record, setRecord] = useState<Maintenance | null>(null);
  const [minorName, setMinorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [maintenanceId]);

  const loadData = async () => {
    try {
      const data = await maintenanceService.getMaintenance(maintenanceId);
      setRecord(data);
      if (data) {
        const minor = await minorService.getMinor(data.minorId);
        if (minor) setMinorName(minor.name);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!record || !user) return;
    try {
      await maintenanceService.markAsPaid(record.id, user.uid, userData?.displayName || 'Usuario');
      loadData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleUploadProof = async (uri: string) => {
    if (!record) return;
    try {
      await maintenanceService.uploadProof(record.id, uri, record.agreementId);
      showToast(t('maintenance.receiptAttached'), 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!record) return <Text style={{ padding: SPACING.lg }}>{t('maintenance.noRecords')}</Text>;

  const canMarkPaid = record.status === 'pending' && record.payerUid === user?.uid;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.month}>{formatMonthLabel(record.month)}</Text>
        <ApprovalBadge status={record.status === 'paid' ? 'paid' : 'pending'} />
      </View>

      <Text style={styles.minor}>{minorName}</Text>
      <Text style={styles.amount}>{formatCurrency(record.amount)}</Text>

      {record.proofUrl && (
        <View style={styles.proofSection}>
          <Text style={styles.label}>{t('maintenance.receipt')}</Text>
          <Image source={{ uri: record.proofUrl }} style={styles.proofImage} resizeMode="contain" />
        </View>
      )}

      {canMarkPaid && (
        <>
          <TouchableOpacity style={styles.button} onPress={handleMarkPaid}>
            <Text style={styles.buttonText}>{t('maintenance.markAsPaid')}</Text>
          </TouchableOpacity>
          <View style={{ marginTop: SPACING.md }}>
            <ImagePickerButton onImageSelected={handleUploadProof} label={t('maintenance.attachReceipt')} />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  month: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  minor: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, marginBottom: SPACING.sm },
  amount: { fontSize: 36, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textMuted, marginBottom: SPACING.sm },
  proofSection: { marginBottom: SPACING.lg },
  proofImage: { width: '100%', height: 200, borderRadius: 16, backgroundColor: COLORS.card },
  button: { backgroundColor: COLORS.success, padding: SPACING.md, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
});

export default MaintenanceDetailScreen;
