import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { calendarService } from '../../services/calendarService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { authorizationService } from '../../services/authorizationService';
import { Minor, PatternRule } from '../../types';
import DatePickerField from '../../components/common/DatePickerField';
import { useSubscription } from '../../context/SubscriptionContext';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AddEventScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const preDateStr = route.params?.date || '';
  const authorizationId: string | undefined = route.params?.authorizationId;
  const prefillTitle: string = route.params?.prefillTitle || '';
  const prefillMinorId: string = route.params?.prefillMinorId || '';
  const initialDate = preDateStr ? new Date(preDateStr + 'T00:00:00') : new Date();

  const { user, userData } = useAuth();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
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
  const [frequency, setFrequency] = useState<PatternRule['frequency']>('weekly');
  const [durationDays, setDurationDays] = useState('7');
  const [startsFirst, setStartsFirst] = useState(user?.uid || '');
  const [patternEndDate, setPatternEndDate] = useState<Date | null>(null);

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
    if (!selectedMinorId) { Alert.alert('Error', 'Selecciona un menor'); return; }
    if (!title.trim()) { Alert.alert('Error', 'El título es obligatorio'); return; }
    if (!currentAgreement || !user) return;

    try {
      setSaving(true);

      let patternRule: string | undefined;
      let eventEndDate = endDate;
      if (isPattern && isPremium) {
        const days = parseInt(durationDays, 10) || 7;
        const otherMember = members.find((m) => m.uid !== startsFirst)?.uid || '';
        const rule: PatternRule = {
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
        patternRule,
      });
      if (authorizationId) {
        await authorizationService.linkToCalendar(authorizationId, event.id);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nuevo evento</Text>

      <Text style={styles.label}>Menor</Text>
      <View style={styles.optionsRow}>
        {minors.map((m) => (
          <TouchableOpacity key={m.id} style={[styles.option, selectedMinorId === m.id && styles.optionSelected]} onPress={() => setSelectedMinorId(m.id)}>
            <Text style={[styles.optionText, selectedMinorId === m.id && styles.optionTextSelected]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título del evento" placeholderTextColor={COLORS.textMuted} />

      <DatePickerField
        label="Fecha inicio"
        value={startDate}
        onChange={(d) => {
          setStartDate(d);
          if (d > endDate) setEndDate(d);
        }}
        placeholder="Seleccionar fecha"
      />

      <DatePickerField
        label="Fecha fin"
        value={endDate}
        onChange={setEndDate}
        minimumDate={startDate}
        placeholder="Seleccionar fecha"
      />

      {!isPattern && (
        <>
          <Text style={styles.label}>Asignado a</Text>
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
            {isPattern && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.patternToggleText}>Patrón de custodia</Text>
        </TouchableOpacity>

        {!isPremium && (
          <View style={styles.premiumNote}>
            <Text style={styles.premiumNoteText}>
              Patrones de custodia disponibles con Premium
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
              <Text style={styles.premiumLink}>Ver planes</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPattern && isPremium && (
          <View style={styles.patternOptions}>
            <Text style={styles.label}>Frecuencia</Text>
            <View style={styles.optionsRow}>
              {([['weekly', 'Semanal'], ['biweekly', 'Quincenal'], ['monthly', 'Mensual']] as const).map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.option, frequency === val && styles.optionSelected]} onPress={() => setFrequency(val)}>
                  <Text style={[styles.optionText, frequency === val && styles.optionTextSelected]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Días por turno</Text>
            <TextInput
              style={styles.input}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Empieza</Text>
            <View style={styles.optionsRow}>
              {members.map((m) => (
                <TouchableOpacity key={m.uid} style={[styles.option, startsFirst === m.uid && styles.optionSelected]} onPress={() => setStartsFirst(m.uid)}>
                  <Text style={[styles.optionText, startsFirst === m.uid && styles.optionTextSelected]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <DatePickerField
              label="Fecha fin del patrón (opcional)"
              value={patternEndDate}
              onChange={(d) => setPatternEndDate(d)}
              minimumDate={startDate}
              placeholder="Sin fecha fin"
            />
          </View>
        )}
      </View>

      {currentAgreement?.approvalMode && !isPattern && (
        <View style={styles.approvalNote}>
          <Text style={styles.approvalText}>Modo aprobación activo: el evento requerirá aprobación del otro miembro.</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
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
  approvalNote: { backgroundColor: COLORS.info + '15', borderRadius: 8, padding: SPACING.md, marginTop: SPACING.md },
  approvalText: { fontSize: FONT_SIZES.sm, color: COLORS.info },
  button: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  patternSection: { marginTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.md },
  patternToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  patternToggleText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  patternOptions: { marginTop: SPACING.sm },
  premiumNote: { backgroundColor: COLORS.info + '15', borderRadius: 8, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumNoteText: { fontSize: FONT_SIZES.sm, color: COLORS.info, flex: 1 },
  premiumLink: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600', marginLeft: SPACING.sm },
});

export default AddEventScreen;
