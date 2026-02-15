import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import MinorListScreen from '../screens/home/MinorListScreen';
import AddMinorScreen from '../screens/home/AddMinorScreen';
import MinorDetailScreen from '../screens/home/MinorDetailScreen';
import EditMinorScreen from '../screens/home/EditMinorScreen';
import MaintenanceListScreen from '../screens/home/MaintenanceListScreen';
import AddMaintenanceScreen from '../screens/home/AddMaintenanceScreen';
import MaintenanceDetailScreen from '../screens/home/MaintenanceDetailScreen';
import AuthorizationListScreen from '../screens/settings/AuthorizationListScreen';
import AddAuthorizationScreen from '../screens/settings/AddAuthorizationScreen';
import AuthorizationDetailScreen from '../screens/settings/AuthorizationDetailScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import { COLORS } from '../config/theme';

export type HomeStackParamList = {
  Dashboard: undefined;
  MinorList: undefined;
  AddMinor: undefined;
  MinorDetail: { minorId: string };
  EditMinor: { minorId: string };
  MaintenanceList: { minorId?: string } | undefined;
  AddMaintenance: { minorId?: string } | undefined;
  MaintenanceDetail: { maintenanceId: string };
  AuthorizationList: undefined;
  AddAuthorization: undefined;
  AuthorizationDetail: { authorizationId: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: COLORS.primary,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen name="Dashboard" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MinorList" component={MinorListScreen} options={{ title: 'Menores' }} />
    <Stack.Screen name="AddMinor" component={AddMinorScreen} options={{ title: 'Añadir menor' }} />
    <Stack.Screen name="MinorDetail" component={MinorDetailScreen} options={{ title: 'Detalle menor' }} />
    <Stack.Screen name="EditMinor" component={EditMinorScreen} options={{ title: 'Editar menor' }} />
    <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} options={{ title: 'Manutención' }} />
    <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} options={{ title: 'Nueva manutención' }} />
    <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ title: 'Detalle manutención' }} />
    <Stack.Screen name="AuthorizationList" component={AuthorizationListScreen} options={{ title: 'Autorizaciones' }} />
    <Stack.Screen name="AddAuthorization" component={AddAuthorizationScreen} options={{ title: 'Nueva autorización' }} />
    <Stack.Screen name="AuthorizationDetail" component={AuthorizationDetailScreen} options={{ title: 'Detalle autorización' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
  </Stack.Navigator>
);

export default HomeStackNavigator;
