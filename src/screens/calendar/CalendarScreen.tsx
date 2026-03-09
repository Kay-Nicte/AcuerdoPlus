import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = i18next.language === 'es' ? 'es' : '';
import { useAgreement } from '../../context/AgreementContext';
import { calendarService } from '../../services/calendarService';
import { CalendarEvent, Minor } from '../../types';
import { minorService } from '../../services/minorService';
import EventCard from '../../components/calendar/EventCard';
import EmptyState from '../../components/common/EmptyState';
import { formatDateISO } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, MEMBER_COLOR_PALETTE } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { agreementService } from '../../services/agreementService';
import { authService } from '../../services/authService';

const addDaysLocal = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const CalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { currentAgreement, refreshAgreement } = useAgreement();
  const { userData } = useAuth();
  const { showToast } = useToast();

  // Update calendar locale when language changes
  LocaleConfig.defaultLocale = i18n.language === 'es' ? 'es' : '';
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [memberNames, setMemberNames] = useState<{ [uid: string]: string }>({});
  const [minors, setMinors] = useState<Minor[]>([]);
  const [selectedMinorId, setSelectedMinorId] = useState<string | null>(null); // null = General

  useEffect(() => {
    if (!currentAgreement) return;
    const loadNames = async () => {
      const names: { [uid: string]: string } = {};
      for (const uid of currentAgreement.members) {
        const u = await authService.getUserData(uid);
        names[uid] = u?.displayName || uid;
      }
      setMemberNames(names);
    };
    loadNames();
  }, [currentAgreement]);

  const loadEvents = async () => {
    if (!currentAgreement) return;
    try {
      const [list, minorList] = await Promise.all([
        calendarService.getEvents(currentAgreement.id),
        minorService.getMinors(currentAgreement.id),
      ]);
      setAllEvents(list);
      setMinors(minorList);
      filterByDate(list, selectedDate, selectedMinorId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filterByMinor = (eventsList: CalendarEvent[], minorId: string | null): CalendarEvent[] => {
    if (!minorId) return eventsList;
    return eventsList.filter((e) => e.minorId === minorId);
  };

  const filterByDate = (eventsList: CalendarEvent[], date: string, minorId?: string | null) => {
    const minorFiltered = filterByMinor(eventsList, minorId ?? selectedMinorId);
    const filtered = minorFiltered.filter((e) => {
      const start = formatDateISO(e.startDate);
      const end = formatDateISO(e.endDate);
      return date >= start && date <= end;
    });
    setEvents(filtered);
  };

  useFocusEffect(useCallback(() => { loadEvents(); }, [currentAgreement]));

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    filterByDate(allEvents, day.dateString);
  };

  const handleMinorFilter = (minorId: string | null) => {
    setSelectedMinorId(minorId);
    filterByDate(allEvents, selectedDate, minorId);
  };

  // Build marked dates with member colors
  const getMemberColor = (uid: string): string => {
    if (!currentAgreement) return COLORS.primary;
    if (currentAgreement.memberColors?.[uid]) return currentAgreement.memberColors[uid];
    const idx = currentAgreement.members.indexOf(uid);
    if (idx === 0) return COLORS.memberA;
    if (idx === 1) return COLORS.memberB;
    return COLORS.primary;
  };

  const markedDates: Record<string, any> = {};

  // Apply minor filter to calendar marks
  const visibleEvents = filterByMinor(allEvents, selectedMinorId);

  // First pass: pattern instances → color the full day background
  const patternEvents = visibleEvents.filter((e) => e.id.includes('_'));
  const regularEvents = visibleEvents.filter((e) => !e.id.includes('_'));

  patternEvents.forEach((e) => {
    let d = new Date(e.startDate);
    const endD = new Date(e.endDate);
    while (d <= endD) {
      const dateStr = formatDateISO(d);
      const color = getMemberColor(e.assignedTo);
      // For period marking: determine if start/end of a contiguous block
      markedDates[dateStr] = {
        ...(markedDates[dateStr] || {}),
        color: color + '30',
        textColor: COLORS.text,
        startingDay: !markedDates[formatDateISO(addDaysLocal(d, -1))]?.color,
        endingDay: true, // will be recalculated
      };
      d.setDate(d.getDate() + 1);
    }
  });

  // Recalculate startingDay/endingDay for contiguous same-color blocks
  const sortedDates = Object.keys(markedDates).sort();
  sortedDates.forEach((dateStr, i) => {
    const prev = sortedDates[i - 1];
    const next = sortedDates[i + 1];
    const curr = markedDates[dateStr];
    if (!curr.color) return;

    const prevEntry = prev ? markedDates[prev] : null;
    const nextEntry = next ? markedDates[next] : null;

    // Check if prev date is exactly 1 day before and same color
    const prevDate = prev ? new Date(prev + 'T00:00:00') : null;
    const currDate = new Date(dateStr + 'T00:00:00');
    const nextDate = next ? new Date(next + 'T00:00:00') : null;

    const isPrevContinuous = prevDate && (currDate.getTime() - prevDate.getTime() === 86400000) && prevEntry?.color === curr.color;
    const isNextContinuous = nextDate && (nextDate.getTime() - currDate.getTime() === 86400000) && nextEntry?.color === curr.color;

    curr.startingDay = !isPrevContinuous;
    curr.endingDay = !isNextContinuous;
  });

  // Second pass: regular events → add dot marker
  regularEvents.forEach((e) => {
    const dateStr = formatDateISO(e.startDate);
    markedDates[dateStr] = {
      ...(markedDates[dateStr] || {}),
      marked: true,
      dotColor: COLORS.primaryDark,
    };
  });

  // Selected date
  if (markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: COLORS.primaryDark,
      selectedTextColor: COLORS.white,
    };
  } else {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: COLORS.primary,
      selectedTextColor: COLORS.white,
    };
  }

  return (
    <View style={styles.container}>
      <Calendar
        key={i18n.language}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="period"
        firstDay={1}
        theme={{
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
          selectedDayBackgroundColor: COLORS.primary,
        }}
      />
      {/* Minor filter tabs */}
      {minors.length > 1 && (
        <View style={styles.minorTabs}>
          <TouchableOpacity
            style={[styles.minorTab, selectedMinorId === null && styles.minorTabActive]}
            onPress={() => handleMinorFilter(null)}
          >
            <Text style={[styles.minorTabText, selectedMinorId === null && styles.minorTabTextActive]}>
              {t('calendar.general')}
            </Text>
          </TouchableOpacity>
          {minors.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.minorTab, selectedMinorId === m.id && styles.minorTabActive]}
              onPress={() => handleMinorFilter(m.id)}
            >
              <Text style={[styles.minorTabText, selectedMinorId === m.id && styles.minorTabTextActive]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Color legend / picker */}
      {currentAgreement && currentAgreement.members.length > 0 && (
        <View style={styles.legendBar}>
          {currentAgreement.members.map((uid) => {
            const color = getMemberColor(uid);
            const isMe = uid === userData?.uid;
            const name = memberNames[uid] || '';
            return (
              <TouchableOpacity
                key={uid}
                style={styles.legendItem}
                onPress={() => isMe && setShowColorPicker(!showColorPicker)}
                activeOpacity={isMe ? 0.6 : 1}
              >
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendName} numberOfLines={1}>{name}</Text>
                {isMe && <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {showColorPicker && userData && currentAgreement && (
        <View style={styles.colorPickerRow}>
          {MEMBER_COLOR_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={async () => {
                try {
                  await agreementService.setMemberColor(currentAgreement.id, userData.uid, color);
                  await refreshAgreement();
                  setShowColorPicker(false);
                } catch (error: any) {
                  showToast(error.message, 'error');
                }
              }}
            >
              <View style={[
                styles.colorOption,
                { backgroundColor: color },
                currentAgreement.memberColors?.[userData.uid] === color && styles.colorOptionSelected,
              ]} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>{t('calendar.dayEvents')}</Text>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => {
              const isPatternInstance = item.id.includes('_');
              navigation.navigate('EventDetail', {
                eventId: item.id,
                ...(isPatternInstance && {
                  patternInstance: {
                    startDate: item.startDate.toISOString(),
                    endDate: item.endDate.toISOString(),
                    assignedTo: item.assignedTo,
                  },
                }),
              });
            }} />
          )}
          ListEmptyComponent={<EmptyState message={t('calendar.noEvents')} icon="calendar-outline" />}
          contentContainerStyle={styles.list}
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent', { date: selectedDate })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  eventsSection: { flex: 1, padding: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  list: { flexGrow: 1 },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.lg,
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabText: { color: COLORS.white, fontSize: 26, fontWeight: '300', marginTop: -2 },
  legendBar: {
    flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { fontSize: FONT_SIZES.xs, color: COLORS.text, fontWeight: '500', maxWidth: 100 },
  colorPickerRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  colorOption: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: COLORS.text, borderWidth: 3 },
  minorTabs: {
    flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  minorTab: {
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
    borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  minorTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  minorTabText: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textMuted },
  minorTabTextActive: { color: COLORS.white },
});

export default CalendarScreen;
