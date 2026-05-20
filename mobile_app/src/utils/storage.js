import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gamifying_jwt';
const LANG_KEY = 'gamifying_lang';

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveLanguage(lang) {
  await SecureStore.setItemAsync(LANG_KEY, lang);
}

export async function getLanguage() {
  return SecureStore.getItemAsync(LANG_KEY);
}
