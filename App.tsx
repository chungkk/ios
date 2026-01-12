import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import i18n from './src/utils/i18n';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}