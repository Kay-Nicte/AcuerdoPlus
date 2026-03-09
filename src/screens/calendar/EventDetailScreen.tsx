import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { calendarService } from '../../services/calendarService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { CalendarEvent } from '../../types';
import { formatDate } from '../../utils/formatters';
import { parsePatternRule, frequencyLabel } from '../../utils/patternExpander';
import ApprovalBadge from '../../components/common/ApprovalBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useToast } from '../../context/ToastContext';

const EventDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { eventId, patternInstance } = route.params;
  const isPatternInstance = !!patternInstance || eventId.includes('_');
  const realEventId = isPatternInstance ? eventId.split('_')[0] : eventId;

  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [minorName, setMinorName] = useState('');
  const [assignedName, setAssignedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, [eventId]);

  const loadData = async () => {
    try {
      const data = await calendarService.getEvent(realEventId);
      if (data && patternInstance) {
        // Override with pattern instance data
        data.startDate = new Date(patternInstance.startDate);
        data.endDate = new Date(patternInstance.endDate);
        data.assignedTo = patternInstance.assignedTo;
      }
      setEvent(data);
      if (data) {
        const minor = await minorService.getMinor(data.minorId);
        if (minor) setMinorName(minor.name);
        const assignedUid = patternInstance?.assignedTo || data.assignedTo;
        const assigned = await authService.getUserData(assignedUid);
        if (assigned) setAssignedName(assigned.displayName);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (approved: boolean) => {
    if (!event || !user) return;
    try {
      const reason = approved ? undefined : rejectReason.trim() || undefined;
      await calendarService.respondToEvent(event.id, user.uid, userData?.displayName || 'Usuario', approved, reason);
      loadData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!event) return <Text style={{ padding: SPACING.lg }}>{t('eventDetail.notFound')}</Text>;

  const canRespond = !isPatternInstance && event.approvalStatus === 'pending' && event.createdBy !== user?.uid;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        {event.approvalStatus && <ApprovalBadge status={event.approvalStatus} />}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('eventDetail.minor')}</Text>
          <Text style={styles.value}>{minorName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('eventDetail.start')}</Text>
          <Text style={styles.value}>{formatDate(event.startDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('eventDetail.end')}</Text>
          <Text style={styles.value}>{formatDate(event.endDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('eventDetail.assignedTo')}</Text>
          <Text style={styles.value}>{assignedName}</Text>
        </View>
        {(event.isPattern || isPatternInstance) && (() => {
          const rule = parsePatternRule(event.patternRule);
          return (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>{t('eventDetail.type')}</Text>
                <Text style={[styles.value, { color: COLORS.info }]}>
                  {isPatternInstance ? t('eventDetail.recurringPart') : t('eventDetail.autoPattern')}
                </Text>
              </View>
              {rule && (
                <View style={styles.row}>
                  <Text style={styles.label}>{t('eventDetail.frequency')}</Text>
                  <Text style={styles.value}>
                    {frequencyLabel(rule.frequency)} {t('eventDetail.daysPerTurn', { days: rule.durationDays })}
                  </Text>
                </View>
              )}
            </>
          );
        })()}
      </View>

      {event.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>{t('eventDetail.rejectionReason')}</Text>
          <Text style={styles.rejectionText}>{event.rejectionReason}</Text>
        </View>
      )}

      {event.approvalExpiresAt && event.approvalStatus === 'pending' && (
        <Text style={styles.expiresText}>
          {t('eventDetail.expiresAt', { date: formatDate(event.approvalExpiresAt) })}
        </Text>
      )}

      {canRespond && (
        <>
          <TextInput
            style={styles.reasonInput}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder={t('eventDetail.rejectionReasonOptional')}
            placeholderTextColor={COLORS.textMuted}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.approveButton} onPress={() => handleRespond(true)}>
              <Text style={styles.approveText}>{t('eventDetail.approve')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => handleRespond(false)}>
              <Text style={styles.rejectText}>{t('eventDetail.reject')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  infoCard: { backgroundColor: COLORS.backgroundSecondary, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  actions: { flexDirection: 'row', gap: SPACING.md },
  approveButton: { flex: 1, backgroundColor: COLORS.success, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  approveText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  rejectButton: { flex: 1, backgroundColor: COLORS.error, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  rejectText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  reasonInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: COLORS.text, marginBottom: SPACING.md },
  rejectionBox: { backgroundColor: COLORS.error + '10', borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.md },
  rejectionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.error, fontWeight: '600', marginBottom: 4 },
  rejectionText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  expiresText: { fontSize: FONT_SIZES.xs, color: COLORS.warning, marginBottom: SPACING.md, fontStyle: 'italic' },
});

export default EventDetailScreen;
