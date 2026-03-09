import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import HistoryScreen from '../screens/settings/HistoryScreen';
import SubscriptionScreen from '../screens/settings/SubscriptionScreen';
import PdfExportScreen from '../screens/settings/PdfExportScreen';
import AuthorizationListScreen from '../screens/settings/AuthorizationListScreen';
import AddAuthorizationScreen from '../screens/settings/AddAuthorizationScreen';
import AuthorizationDetailScreen from '../screens/settings/AuthorizationDetailScreen';
import { COLORS } from '../config/theme';
import i18next from 'i18next';

export type SettingsStackParamList = {
  SettingsMain: undefined;
  EditProfile: undefined;
  History: undefined;
  Subscription: undefined;
  PdfExport: undefined;
  AuthorizationList: undefined;
  AddAuthorization: undefined;
  AuthorizationDetail: { authorizationId: string };
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: COLORS.primary,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: i18next.t('editProfile.title') }} />
    <Stack.Screen name="History" component={HistoryScreen} options={{ title: i18next.t('history.title') }} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: i18next.t('subscription.title') }} />
    <Stack.Screen name="PdfExport" component={PdfExportScreen} options={{ title: i18next.t('pdfExport.title') }} />
    <Stack.Screen name="AuthorizationList" component={AuthorizationListScreen} options={{ title: i18next.t('authz.title') }} />
    <Stack.Screen name="AddAuthorization" component={AddAuthorizationScreen} options={{ title: i18next.t('authz.newAuthorization') }} />
    <Stack.Screen name="AuthorizationDetail" component={AuthorizationDetailScreen} options={{ title: i18next.t('authz.title') }} />
  </Stack.Navigator>
);

export default SettingsStackNavigator;
