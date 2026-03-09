import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import AddEventScreen from '../screens/calendar/AddEventScreen';
import EventDetailScreen from '../screens/calendar/EventDetailScreen';
import { COLORS } from '../config/theme';

export type CalendarStackParamList = {
  CalendarMain: undefined;
  AddEvent: { date?: string; authorizationId?: string; prefillTitle?: string; prefillMinorId?: string } | undefined;
  EventDetail: { eventId: string };
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

const CalendarStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: COLORS.primary,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen name="CalendarMain" component={CalendarScreen} options={{ title: 'Calendario' }} />
    <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ title: 'Nuevo evento' }} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Detalle evento' }} />
  </Stack.Navigator>
);

export default CalendarStackNavigator;
