import type { UserProfile } from '../types';

const PROFILE_KEY = 'applytica_profile';

export const getProfile = async (): Promise<UserProfile | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILE_KEY], (result) => {
      resolve((result[PROFILE_KEY] as UserProfile) || null);
    });
  });
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PROFILE_KEY]: profile }, () => {
      resolve();
    });
  });
};

const API_KEY_KEY = 'applytica_api_key';

export const getApiKey = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([API_KEY_KEY], (result) => {
      resolve((result[API_KEY_KEY] as string) || null);
    });
  });
};

export const saveApiKey = async (apiKey: string): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [API_KEY_KEY]: apiKey }, () => {
      resolve();
    });
  });
};
