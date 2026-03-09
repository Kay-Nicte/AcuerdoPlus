import React from 'react';
import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AgreementProvider } from './src/context/AgreementContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
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
  );
}
