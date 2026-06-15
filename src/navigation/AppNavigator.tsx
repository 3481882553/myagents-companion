/**
 * 主导航器
 * v0.2 架构升级 — React Navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { linking } from './LinkingConfig';

// 页面组件（延迟导入避免循环依赖）
import { HomeScreen } from '../screens/HomeScreen';
import { ConnectionScreen } from '../screens/ConnectionScreen';
import { SessionListScreen } from '../screens/SessionListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HelperScreen } from '../screens/HelperScreen';

export type RootStackParamList = {
  Home: undefined;
  Connection: undefined;
  SessionList: undefined;
  Chat: { sessionId: string };
  Helper: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#faf6ee',
          },
          headerTintColor: '#1c1612',
          headerTitleStyle: {
            fontWeight: '600',
          },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
