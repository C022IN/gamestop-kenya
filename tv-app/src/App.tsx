import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from '@/navigation/AppNavigator';
import { ProjectorProvider } from '@/context/ProjectorContext';
import OverscanView from '@/components/OverscanView';

export default function App() {
  return (
    <SafeAreaProvider>
      <ProjectorProvider>
        <OverscanView>
          <AppNavigator />
        </OverscanView>
      </ProjectorProvider>
    </SafeAreaProvider>
  );
}
