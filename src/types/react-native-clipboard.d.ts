declare module '@react-native-clipboard/clipboard' {
  export function setString(text: string): void;
  export function getString(): Promise<string>;
}
