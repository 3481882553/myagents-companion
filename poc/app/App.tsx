/**
 * MyAgents Companion — App 入口
 * v0.2 架构升级 — React Navigation + ErrorBoundary + Zustand
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { HomeScreen } from './src/screens/HomeScreen';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { SessionListScreen } from './src/screens/SessionListScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { HelperScreen } from './src/screens/HelperScreen';
import { KaTeXDemo } from './src/components/KaTeXDemo';
import { MermaidDemo } from './src/components/MermaidDemo';
import { BashToolDemo } from './src/components/BashToolDemo';
import { StorageService } from './src/services/StorageService';
import { useConnectionStore } from './src/store/connectionStore';
import { initLogger } from './src/services/MobileLogger';
import type { RootStackParamList } from './src/navigation/AppNavigator';

const TAG = '[App]';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    console.log(TAG, 'App 已挂载');

    // 启动时恢复持久化连接
    const savedConnection = StorageService.getConnection();
    const savedToken = StorageService.getToken();
    if (savedConnection && savedToken) {
      console.log(TAG, '恢复持久化连接:', savedConnection.host);
      // 恢复到 Zustand store
      useConnectionStore.getState().restoreConnection(
        savedConnection.host, savedConnection.port, savedToken
      );
      // 恢复日志
      initLogger(`${savedConnection.host}:${savedConnection.port}`, savedToken);
    } else {
      console.log(TAG, '无持久化连接');
    }

    return () => console.log(TAG, 'App 将卸载');
  }, []);

  return (
    <ErrorBoundary>
      <NavigationContainer
        onStateChange={(state) => {
          const route = state?.routes?.[state.index ?? 0];
          console.log(TAG, '路由:', route?.name);
        }}
      >
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#faf6ee' },
            headerTintColor: '#1c1612',
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'MyAgents Companion' }}
          />
          <Stack.Screen
            name="Connection"
            component={ConnectionScreen}
            options={{ title: '连接桌面端' }}
          />
          <Stack.Screen
            name="SessionList"
            component={SessionListScreen}
            options={{ title: '会话列表' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: '聊天' }}
          />
          <Stack.Screen
            name="Helper"
            component={HelperScreen}
            options={{ title: '小助理' }}
          />
          <Stack.Screen
            name="KaTeX"
            component={KaTeXDemo}
            options={{ title: 'KaTeX 公式渲染' }}
          />
          <Stack.Screen
            name="Mermaid"
            component={MermaidDemo}
            options={{ title: 'Mermaid 图表' }}
          />
          <Stack.Screen
            name="Bash"
            component={BashToolDemo}
            options={{ title: 'BashTool 终端' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
