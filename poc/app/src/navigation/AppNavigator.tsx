/**
 * 主导航器
 * v0.2 架构升级 — React Navigation
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { linking } from './LinkingConfig';

// 页面组件
import { HomeScreen } from '../screens/HomeScreen';
import { ConnectionScreen } from '../screens/ConnectionScreen';
import { SessionListScreen } from '../screens/SessionListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HelperScreen } from '../screens/HelperScreen';

const TAG = '[AppNavigator]';

export type RootStackParamList = {
  Home: undefined;
  Connection: undefined;
  SessionList: undefined;
  Chat: { sessionId: string };
  Helper: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  useEffect(() => {
    console.log(TAG, '导航器已挂载');
    return () => console.log(TAG, '导航器将卸载');
  }, []);

  console.log(TAG, '渲染');

  return (
    <NavigationContainer
      linking={linking}
      onStateChange={(state) => {
        const route = state?.routes?.[state.index ?? 0];
        console.log(TAG, '路由变化:', route?.name);
      }}
      onReady={() => {
        console.log(TAG, '导航容器就绪');
      }}
    >
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
