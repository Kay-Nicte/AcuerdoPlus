import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useAgreement } from '../../context/AgreementContext';
import { calendarService } from '../../services/calendarService';
import { CalendarEvent } from '../../types';
import EventCard from '../../components/calendar/EventCard';
import EmptyState from '../../components/common/EmptyState';
import { formatDateISO } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const CalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentAgreement } = useAgreement();
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);

  const loadEvents = async () => {
    if (!currentAgreement) return;
    try {
      const list = await calendarService.getEvents(currentAgreement.id);
      setAllEvents(list);
      filterByDate(list, selectedDate);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filterByDate = (eventsList: CalendarEvent[], date: string) => {
    const filtered = eventsList.filter((e) => {
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

  // Build marked dates
  const markedDates: Record<string, any> = {};
  allEvents.forEach((e) => {
    const dateStr = formatDateISO(e.startDate);
    const isPatternInstance = e.id.includes('_');
    markedDates[dateStr] = {
      ...(markedDates[dateStr] || {}),
      marked: true,
      dotColor: isPatternInstance ? COLORS.info : COLORS.primary,
    };
  });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLORS.primary,
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
          selectedDayBackgroundColor: COLORS.primary,
        }}
      />
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Eventos del dia</Text>
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
          ListEmptyComponent={<EmptyState message="Sin eventos para este dia" icon="📅" />}
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
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', marginTop: -2 },
});

export default CalendarScreen;
