/**
 * @format
 * v0.2 架构升级入口（兼容模式：src/ 代码由 Poc App.tsx 桥接）
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

console.log('[index.js] 注册 App, appName:', appName);
AppRegistry.registerComponent(appName, () => App);
