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
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import HistoryScreen from '../screens/settings/HistoryScreen';
import SubscriptionScreen from '../screens/settings/SubscriptionScreen';
import PdfExportScreen from '../screens/settings/PdfExportScreen';
import { COLORS } from '../config/theme';
import i18next from 'i18next';

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
  Settings: undefined;
  EditProfile: undefined;
  History: undefined;
  Subscription: undefined;
  PdfExport: undefined;
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
    <Stack.Screen name="MinorList" component={MinorListScreen} options={{ title: i18next.t('minors.title') }} />
    <Stack.Screen name="AddMinor" component={AddMinorScreen} options={{ title: i18next.t('minors.addMinor') }} />
    <Stack.Screen name="MinorDetail" component={MinorDetailScreen} options={{ title: i18next.t('minors.minorDetail') }} />
    <Stack.Screen name="EditMinor" component={EditMinorScreen} options={{ title: i18next.t('minors.editMinor') }} />
    <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} options={{ title: i18next.t('maintenance.title') }} />
    <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} options={{ title: i18next.t('maintenance.newMaintenance') }} />
    <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ title: i18next.t('maintenance.title') }} />
    <Stack.Screen name="AuthorizationList" component={AuthorizationListScreen} options={{ title: i18next.t('authz.title') }} />
    <Stack.Screen name="AddAuthorization" component={AddAuthorizationScreen} options={{ title: i18next.t('authz.newAuthorization') }} />
    <Stack.Screen name="AuthorizationDetail" component={AuthorizationDetailScreen} options={{ title: i18next.t('authz.title') }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: i18next.t('home.notifications') }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: i18next.t('settings.title') }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: i18next.t('editProfile.title') }} />
    <Stack.Screen name="History" component={HistoryScreen} options={{ title: i18next.t('history.title') }} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: i18next.t('subscription.title') }} />
    <Stack.Screen name="PdfExport" component={PdfExportScreen} options={{ title: i18next.t('pdfExport.title') }} />
  </Stack.Navigator>
);

export default HomeStackNavigator;
