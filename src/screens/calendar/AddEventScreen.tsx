import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { calendarService } from '../../services/calendarService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { authorizationService } from '../../services/authorizationService';
import { Minor, PatternRule } from '../../types';
import DatePickerField from '../../components/common/DatePickerField';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AddEventScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const preDateStr = route.params?.date || '';
  const authorizationId: string | undefined = route.params?.authorizationId;
  const prefillTitle: string = route.params?.prefillTitle || '';
  const prefillMinorId: string = route.params?.prefillMinorId || '';
  const initialDate = preDateStr ? new Date(preDateStr + 'T00:00:00') : new Date();

  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
  const { showToast } = useToast();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [members, setMembers] = useState<{ uid: string; name: string }[]>([]);

  const [selectedMinorId, setSelectedMinorId] = useState(prefillMinorId);
  const [title, setTitle] = useState(prefillTitle);
  const [startDate, setStartDate] = useState<Date>(initialDate);
  const [endDate, setEndDate] = useState<Date>(initialDate);
  const [assignedTo, setAssignedTo] = useState(user?.uid || '');
  const [saving, setSaving] = useState(false);

  // Pattern state
  const [isPattern, setIsPattern] = useState(false);
  const [patternMode, setPatternMode] = useState<'alternating' | 'weekdays'>('alternating');
  const [frequency, setFrequency] = useState<PatternRule['frequency']>('weekly');
  const [durationDays, setDurationDays] = useState('7');
  const [startsFirst, setStartsFirst] = useState(user?.uid || '');
  const [patternEndDate, setPatternEndDate] = useState<Date | null>(null);
  // Weekday assignments: 0=Sun..6=Sat → uid
  const [weekdayAssignments, setWeekdayAssignments] = useState<{ [day: number]: string }>({});

  useEffect(() => {
    if (currentAgreement) {
      minorService.getMinors(currentAgreement.id).then(setMinors);
      loadMembers();
    }
  }, [currentAgreement]);

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
    if (!selectedMinorId) { showToast(t('calendar.selectMinor'), 'error'); return; }
    if (!title.trim()) { showToast(t('calendar.titleRequired'), 'error'); return; }
    if (!currentAgreement || !user) return;

    try {
      setSaving(true);

      let patternRule: string | undefined;
      let eventEndDate = endDate;
      if (isPattern && isPremium) {
        if (patternMode === 'weekdays') {
          const otherMember = members.find((m) => m.uid !== (members[0]?.uid))?.uid || '';
          const rule: PatternRule = {
            mode: 'weekdays',
            frequency: 'weekly',
            alternating: false,
            assignments: [members[0]?.uid || '', otherMember],
            durationDays: 1,
            weekdayAssignments,
            endDate: patternEndDate ? patternEndDate.toISOString().split('T')[0] : undefined,
          };
          patternRule = JSON.stringify(rule);
          eventEndDate = new Date(startDate);
        } else {
          const days = parseInt(durationDays, 10) || 7;
          const otherMember = members.find((m) => m.uid !== startsFirst)?.uid || '';
          const rule: PatternRule = {
            mode: 'alternating',
            frequency,
            alternating: true,
            assignments: [startsFirst, otherMember],
            durationDays: days,
            endDate: patternEndDate ? patternEndDate.toISOString().split('T')[0] : undefined,
          };
          patternRule = JSON.stringify(rule);
          eventEndDate = new Date(startDate);
          eventEndDate.setDate(eventEndDate.getDate() + days - 1);
        }
      }

      const event = await calendarService.addEvent({
        agreementId: currentAgreement.id,
        minorId: selectedMinorId,
        title: title.trim(),
        startDate,
        endDate: eventEndDate,
        assignedTo: isPattern ? startsFirst : assignedTo,
        createdBy: user.uid,
        createdByName: userData?.displayName || 'Usuario',
        requiresApproval: isPattern ? false : currentAgreement.approvalMode,
        isPattern: isPattern && isPremium,
        ...(patternRule ? { patternRule } : {}),
      });
      if (authorizationId) {
        await authorizationService.linkToCalendar(authorizationId, event.id);
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
      <Text style={styles.title}>{t('calendar.newEvent')}</Text>

      <Text style={styles.label}>{t('calendar.minor')}</Text>
      {minors.length === 0 ? (
        <TouchableOpacity
          style={styles.noMinorsCard}
          onPress={() => navigation.getParent()?.navigate('Inicio', { screen: 'AddMinor' })}
        >
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning} />
          <Text style={styles.noMinorsText}>
            {t('calendar.needMinorFirst')}
          </Text>
          <Text style={styles.noMinorsLink}>{t('calendar.addMinorAction')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.optionsRow}>
          {minors.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.option, selectedMinorId === m.id && styles.optionSelected]} onPress={() => setSelectedMinorId(m.id)}>
              <Text style={[styles.optionText, selectedMinorId === m.id && styles.optionTextSelected]}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>{t('calendar.eventTitle')}</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('calendar.eventTitlePlaceholder')} placeholderTextColor={COLORS.textMuted} />

      <DatePickerField
        label={t('calendar.startDate')}
        value={startDate}
        onChange={(d) => {
          setStartDate(d);
          if (d > endDate) setEndDate(d);
        }}
        placeholder={t('common.selectDate')}
      />

      <DatePickerField
        label={t('calendar.endDate')}
        value={endDate}
        onChange={setEndDate}
        minimumDate={startDate}
        placeholder={t('common.selectDate')}
      />

      {!isPattern && (
        <>
          <Text style={styles.label}>{t('calendar.assignedTo')}</Text>
          <View style={styles.optionsRow}>
            {members.map((m) => (
              <TouchableOpacity key={m.uid} style={[styles.option, assignedTo === m.uid && styles.optionSelected]} onPress={() => setAssignedTo(m.uid)}>
                <Text style={[styles.optionText, assignedTo === m.uid && styles.optionTextSelected]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Pattern toggle */}
      <View style={styles.patternSection}>
        <TouchableOpacity
          style={styles.patternToggle}
          onPress={() => {
            if (!isPremium) return;
            setIsPattern(!isPattern);
          }}
        >
          <View style={[styles.checkbox, isPattern && styles.checkboxChecked]}>
            {isPattern && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.patternToggleText}>{t('calendar.custodyPattern')}</Text>
        </TouchableOpacity>

        {!isPremium && (
          <View style={styles.premiumNote}>
            <Text style={styles.premiumNoteText}>
              {t('calendar.premiumPatterns')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
              <Text style={styles.premiumLink}>{t('calendar.viewPlans')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPattern && isPremium && (
          <View style={styles.patternOptions}>
            {/* Mode selector */}
            <Text style={styles.label}>{t('calendar.patternType')}</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity style={[styles.option, patternMode === 'alternating' && styles.optionSelected]} onPress={() => setPatternMode('alternating')}>
                <Text style={[styles.optionText, patternMode === 'alternating' && styles.optionTextSelected]}>{t('calendar.alternating')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.option, patternMode === 'weekdays' && styles.optionSelected]} onPress={() => setPatternMode('weekdays')}>
                <Text style={[styles.optionText, patternMode === 'weekdays' && styles.optionTextSelected]}>{t('calendar.byWeekday')}</Text>
              </TouchableOpacity>
            </View>

            {patternMode === 'alternating' ? (
              <>
                <Text style={styles.label}>{t('calendar.frequency')}</Text>
                <View style={styles.optionsRow}>
                  {([['weekly', t('calendar.weekly')], ['biweekly', t('calendar.biweekly')], ['monthly', t('calendar.monthly')]] as const).map(([val, label]) => (
                    <TouchableOpacity key={val} style={[styles.option, frequency === val && styles.optionSelected]} onPress={() => setFrequency(val)}>
                      <Text style={[styles.optionText, frequency === val && styles.optionTextSelected]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>{t('calendar.daysPerTurn')}</Text>
                <TextInput
                  style={styles.input}
                  value={durationDays}
                  onChangeText={setDurationDays}
                  keyboardType="number-pad"
                  placeholder="7"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.label}>{t('calendar.startsAt')}</Text>
                <View style={styles.optionsRow}>
                  {members.map((m) => (
                    <TouchableOpacity key={m.uid} style={[styles.option, startsFirst === m.uid && styles.optionSelected]} onPress={() => setStartsFirst(m.uid)}>
                      <Text style={[styles.optionText, startsFirst === m.uid && styles.optionTextSelected]}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('calendar.assignDays')}</Text>
                <Text style={styles.hint}>{t('calendar.assignDaysHint')}</Text>
                <View style={styles.weekdayGrid}>
                  {[
                    [1, t('calendar.mon')],
                    [2, t('calendar.tue')],
                    [3, t('calendar.wed')],
                    [4, t('calendar.thu')],
                    [5, t('calendar.fri')],
                    [6, t('calendar.sat')],
                    [0, t('calendar.sun')],
                  ].map(([dayNum, dayLabel]) => {
                    const day = dayNum as number;
                    const assignedUid = weekdayAssignments[day];
                    const memberIndex = members.findIndex((m) => m.uid === assignedUid);
                    const getMColor = (idx: number, uid: string) => {
                      if (currentAgreement?.memberColors?.[uid]) return currentAgreement.memberColors[uid];
                      return idx === 0 ? COLORS.memberA : COLORS.memberB;
                    };
                    const bgColor = memberIndex >= 0 ? getMColor(memberIndex, assignedUid) : 'transparent';
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.weekdayCell, { backgroundColor: assignedUid ? bgColor + '25' : 'transparent', borderColor: assignedUid ? bgColor : COLORS.border }]}
                        onPress={() => {
                          const newAssignments = { ...weekdayAssignments };
                          if (!assignedUid) {
                            newAssignments[day] = members[0]?.uid || '';
                          } else if (assignedUid === members[0]?.uid && members.length > 1) {
                            newAssignments[day] = members[1].uid;
                          } else {
                            delete newAssignments[day];
                          }
                          setWeekdayAssignments(newAssignments);
                        }}
                      >
                        <Text style={[styles.weekdayLabel, { color: assignedUid ? bgColor : COLORS.textMuted }]}>{dayLabel}</Text>
                        <Text style={[styles.weekdayMember, { color: assignedUid ? bgColor : COLORS.textMuted }]} numberOfLines={1}>
                          {assignedUid ? members.find((m) => m.uid === assignedUid)?.name?.split(' ')[0] || '' : '—'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {members.length >= 2 && (
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: currentAgreement?.memberColors?.[members[0]?.uid] || COLORS.memberA }]} />
                      <Text style={styles.legendText}>{members[0]?.name}</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: currentAgreement?.memberColors?.[members[1]?.uid] || COLORS.memberB }]} />
                      <Text style={styles.legendText}>{members[1]?.name}</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <DatePickerField
              label={t('calendar.patternEndDate')}
              value={patternEndDate}
              onChange={(d) => setPatternEndDate(d)}
              minimumDate={startDate}
              placeholder={t('calendar.noEndDate')}
            />
          </View>
        )}
      </View>

      {currentAgreement?.approvalMode && !isPattern && (
        <View style={styles.approvalNote}>
          <Text style={styles.approvalText}>{t('calendar.approvalModeNote')}</Text>
        </View>
      )}

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
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text, backgroundColor: COLORS.card },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  option: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, backgroundColor: COLORS.card },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  optionText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  optionTextSelected: { color: COLORS.white, fontWeight: '600' },
  approvalNote: { backgroundColor: COLORS.info + '15', borderRadius: 12, padding: SPACING.md, marginTop: SPACING.md },
  approvalText: { fontSize: FONT_SIZES.sm, color: COLORS.info },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 12, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  patternSection: { marginTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.md },
  patternToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  patternToggleText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  patternOptions: { marginTop: SPACING.sm },
  premiumNote: { backgroundColor: COLORS.info + '15', borderRadius: 12, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumNoteText: { fontSize: FONT_SIZES.sm, color: COLORS.info, flex: 1 },
  premiumLink: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600', marginLeft: SPACING.sm },
  noMinorsCard: {
    flexDirection: 'column', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.warning + '40',
    borderRadius: 12, backgroundColor: COLORS.warningBg,
  },
  noMinorsText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  noMinorsLink: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  hint: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginBottom: SPACING.sm },
  weekdayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  weekdayCell: {
    width: '13%' as any, minWidth: 44, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: SPACING.sm, alignItems: 'center', flex: 1,
  },
  weekdayLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  weekdayMember: { fontSize: 10, marginTop: 2 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginTop: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
});

export default AddEventScreen;
