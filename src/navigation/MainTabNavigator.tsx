import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStackNavigator from './HomeStackNavigator';
import ExpensesStackNavigator from './ExpensesStackNavigator';
import CalendarStackNavigator from './CalendarStackNavigator';
import ChatStackNavigator from './ChatStackNavigator';
import { COLORS } from '../config/theme';
import i18next from 'i18next';

const Tab = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        borderTopColor: COLORS.borderLight,
      },
      tabBarIcon: ({ color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';

        switch (route.name) {
          case 'Inicio':
            iconName = 'home';
            break;
          case 'Gastos':
            iconName = 'receipt';
            break;
          case 'Calendario':
            iconName = 'calendar';
            break;
          case 'Chat':
            iconName = 'chatbubbles';
            break;
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Inicio" component={HomeStackNavigator} options={{ tabBarLabel: i18next.t('tabs.home') }} />
    <Tab.Screen name="Gastos" component={ExpensesStackNavigator} options={{ tabBarLabel: i18next.t('tabs.expenses') }} />
    <Tab.Screen name="Calendario" component={CalendarStackNavigator} options={{ tabBarLabel: i18next.t('tabs.calendar') }} />
    <Tab.Screen name="Chat" component={ChatStackNavigator} options={{ tabBarLabel: i18next.t('tabs.chat') }} />
  </Tab.Navigator>
);

export default MainTabNavigator;
