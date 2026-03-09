import React, { Suspense } from 'react';
import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AgreementProvider } from './src/context/AgreementContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#A93D5C" /></View>}>
      <AuthProvider>
        <AgreementProvider>
          <SubscriptionProvider>
            <ToastProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </ToastProvider>
          </SubscriptionProvider>
        </AgreementProvider>
      </AuthProvider>
    </Suspense>
  );
}
