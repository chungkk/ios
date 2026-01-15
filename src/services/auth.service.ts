import api from './api';
import {
  User,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
} from '../types/user.types';
import { AuthResponse, MeResponse, PointsResponse } from '../types/api.types';
import { saveToken, removeToken, saveData, STORAGE_KEYS } from './storage.service';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Register new user with email/password
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/register', data);

    // Save token to Keychain
    await saveToken(response.data.token);

    // Cache user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, response.data.user);

    return response.data;
  } catch (error) {
    console.error('[AuthService] Register error:', error);
    throw error;
  }
};

/**
 * Login user with email/password
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', data);

    // Save token to Keychain
    await saveToken(response.data.token);

    // Cache user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, response.data.user);

    return response.data;
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user profile
 */
export const fetchMe = async (): Promise<User> => {
  try {
    const response = await api.get<MeResponse>('/api/auth/me');

    // Update cached user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, response.data.user);

    return response.data.user;
  } catch (error) {
    console.error('[AuthService] FetchMe error:', error);
    throw error;
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/refresh');

    // Save new token to Keychain
    await saveToken(response.data.token);

    // Update cached user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, response.data.user);

    return response.data;
  } catch (error) {
    console.error('[AuthService] RefreshToken error:', error);
    throw error;
  }
};

/**
 * Update user profile (name, language, difficulty)
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  try {
    const response = await api.put<MeResponse>('/api/auth/update-profile', data);

    // Update cached user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, response.data.user);

    return response.data.user;
  } catch (error) {
    console.error('[AuthService] UpdateProfile error:', error);
    throw error;
  }
};

/**
 * Logout user (clear token and cached data)
 */
export const logout = async (): Promise<void> => {
  try {
    // Remove token from Keychain
    await removeToken();

    // Clear cached user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, null);

    // Sign out from Google if authenticated
    try {
      const hasPrevious = GoogleSignin.hasPreviousSignIn();
      if (hasPrevious) {
        await GoogleSignin.signOut();
      }
    } catch (googleError) {
      console.log('[AuthService] Google sign out skipped:', googleError);
    }
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    throw error;
  }
};

/**
 * Get user's current points balance
 */
export const fetchPoints = async (): Promise<number> => {
  try {
    const response = await api.get<PointsResponse>('/api/user/points');
    return response.data.points;
  } catch (error) {
    console.error('[AuthService] FetchPoints error:', error);
    throw error;
  }
};

// ===== Google OAuth Functions =====

/**
 * Configure Google Sign-In
 * Call this during app initialization (App.tsx or AuthContext)
 */
export const configureGoogleSignIn = (webClientId: string): void => {
  console.log('[AuthService] Configuring Google Sign-In with webClientId');
  GoogleSignin.configure({
    webClientId, // From Google Cloud Console
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
};

/**
 * Login with Google OAuth
 */
export const loginWithGoogle = async (): Promise<AuthResponse> => {
  try {
    // Check if device supports Google Play Services (iOS always true)
    await GoogleSignin.hasPlayServices();

    // Prompt user to select Google account
    const signInResult = await GoogleSignin.signIn();

    console.log('[AuthService] Google Sign-In result:', signInResult.data?.user.email);

    // Send Google ID token to backend for verification
    const response = await api.post<AuthResponse>('/api/auth/google', {
      idToken: signInResult.data?.idToken,
      user: {
        id: signInResult.data?.user.id,
        email: signInResult.data?.user.email,
        name: signInResult.data?.user.name,
        photo: signInResult.data?.user.photo,
      },
    });

    // Save token to Keychain
    await saveToken(response.data.token);

    // Cache user profile
    await saveData(STORAGE_KEYS.USER_PROFILE, response.data.user);

    return response.data;
  } catch (error: any) {
    console.error('[AuthService] Google Sign-In error:', error);

    // Handle specific Google Sign-In errors
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google Sign-In was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available');
    }

    throw error;
  }
};

