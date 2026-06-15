declare module 'react-native-webview' {
  import { Component } from 'react';

  export interface WebViewMessageEvent {
    nativeEvent: {
      data: string;
    };
  }

  export interface WebViewProps {
    source: { html?: string; uri?: string };
    style?: any;
    onMessage?: (event: WebViewMessageEvent) => void;
    scrollEnabled?: boolean;
    scalesPageToFit?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    javaScriptEnabled?: boolean;
    originWhitelist?: string[];
    mixedContentMode?: string;
  }

  export class WebView extends Component<WebViewProps> {
    reload(): void;
    goBack(): void;
    goForward(): void;
  }
}
