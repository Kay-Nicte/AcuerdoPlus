import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useAgreement } from '../context/AgreementContext';
import { ActivityIndicator, View } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Agreement Screens
import AgreementSelectionScreen from '../screens/agreement/AgreementSelectionScreen';
import CreateAgreementScreen from '../screens/agreement/CreateAgreementScreen';
import CustodyTypeScreen from '../screens/agreement/CustodyTypeScreen';
import JoinAgreementScreen from '../screens/agreement/JoinAgreementScreen';
import InvitePartnerScreen from '../screens/agreement/InvitePartnerScreen';
import WelcomePremiumScreen from '../screens/agreement/WelcomePremiumScreen';

// Main App
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AgreementSelection: undefined;
  CreateAgreement: undefined;
  CustodyType: { agreementId: string; inviteCode: string };
  JoinAgreement: undefined;
  InvitePartner: { agreementId: string; inviteCode: string };
  WelcomePremium: { agreementId: string };
  MainApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentAgreement, loading: agreementLoading } = useAgreement();

  if (authLoading || agreementLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A93D5C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !currentAgreement ? (
          <>
            <Stack.Screen name="AgreementSelection" component={AgreementSelectionScreen} />
            <Stack.Screen name="CreateAgreement" component={CreateAgreementScreen} />
            <Stack.Screen name="CustodyType" component={CustodyTypeScreen} />
            <Stack.Screen name="JoinAgreement" component={JoinAgreementScreen} />
            <Stack.Screen name="InvitePartner" component={InvitePartnerScreen} />
            <Stack.Screen name="WelcomePremium" component={WelcomePremiumScreen} />
          </>
        ) : (
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
