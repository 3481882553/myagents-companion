declare module 'react-native-keychain' {
  export function setGenericPassword(
    username: string,
    password: string,
    service?: string
  ): Promise<boolean>;

  export function getGenericPassword(
    service?: string
  ): Promise<{ username: string; password: string } | false>;

  export function resetGenericPassword(service?: string): Promise<boolean>;
}
