/**
 * MyAgents Companion — App 入口
 * v0.2 架构升级 — React Navigation + ErrorBoundary
 */

import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
}
