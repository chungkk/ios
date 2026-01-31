import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import i18n from '../utils/i18n';
import { User, UpdateProfileRequest } from '../types/user.types';
import * as authService from '../services/auth.service';
import { getToken, getData, STORAGE_KEYS } from '../services/storage.service';

// AuthContext interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  userPoints: number;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, level?: 'beginner' | 'experienced') => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  fetchUserPoints: () => Promise<void>;
  updateUserPoints: (newPoints: number) => void;
  updateDifficultyLevel: (difficultyLevel: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UpdateProfileRequest>) => Promise<{ success: boolean; error?: string }>;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);

  // Fetch user points from API
  const fetchUserPoints = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('[AuthContext] No token found, skipping points fetch');
        return;
      }

      console.log('[AuthContext] Fetching user points...');
      const points = await authService.fetchPoints();
      console.log('[AuthContext] Points fetched:', points);
      setUserPoints(points);
    } catch (error) {
      console.error('[AuthContext] Error fetching user points:', error);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    // Configure Google Sign-In
    if (GOOGLE_WEB_CLIENT_ID) {
      authService.configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    } else {
      console.warn('[AuthContext] GOOGLE_WEB_CLIENT_ID not configured');
    }

    const checkAuth = async () => {
      try {
        const token = await getToken();

        if (!token) {
          setLoading(false);
          return;
        }

        // Check if we have cached user profile
        const cachedUser = await getData<User>(STORAGE_KEYS.USER_PROFILE);
        if (cachedUser) {
          setUser(cachedUser);
          setUserPoints(cachedUser.points || 0);
        }

        // Fetch fresh user data from API
        try {
          const freshUser = await authService.fetchMe();
          setUser(freshUser);
          setUserPoints(freshUser.points || 0);

          // Sync app language with user's native language
          if (freshUser.nativeLanguage && freshUser.nativeLanguage !== i18n.language) {
            i18n.changeLanguage(freshUser.nativeLanguage);
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user data:', error);
          // If cached user exists, keep it (offline mode)
          // If no cached user and API fails, logout
          if (!cachedUser) {
            await authService.logout();
            setUser(null);
            setUserPoints(0);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Check auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login with email/password
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setUserPoints(data.user.points || 0);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      return {
        success: false,
        error: error?.response?.data?.error || error?.response?.data?.message || 'Login failed',
      };
    }
  };

  // Register new user (requires email verification)
  const register = async (
    name: string,
    email: string,
    password: string,
    level: 'beginner' | 'experienced' = 'beginner',
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> => {
    try {
      const data = await authService.register({ name, email, password, level });
      // Registration successful - user needs to verify email
      return {
        success: true,
        requiresVerification: data.requiresVerification,
        email: data.email,
      };
    } catch (error: any) {
      console.error('[AuthContext] Register error:', error);
      return {
        success: false,
        error: error?.response?.data?.error || error?.response?.data?.message || 'Registration failed',
      };
    }
  };

  // Resend verification email
  const resendVerification = async (
    email: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const data = await authService.resendVerification(email);
      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('[AuthContext] Resend verification error:', error);
      return {
        success: false,
        error: error?.response?.data?.error || error?.response?.data?.message || 'Failed to resend verification email',
      };
    }
  };

  // Refresh JWT token
  const refreshToken = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.refreshToken();
      setUser(data.user);
      setUserPoints(data.user.points || 0);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Refresh token error:', error);
      // Token refresh failed, logout user
      await authService.logout();
      setUser(null);
      setUserPoints(0);
      return {
        success: false,
        error: error?.response?.data?.message || 'Token refresh failed',
      };
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.loginWithGoogle();
      setUser(data.user);
      setUserPoints(data.user.points || 0);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Google login error:', error);
      return {
        success: false,
        error: error?.message || 'Google login failed',
      };
    }
  };

  // Login with Apple Sign-In
  const loginWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.loginWithApple();
      setUser(data.user);
      setUserPoints(data.user.points || 0);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Apple login error:', error);
      return {
        success: false,
        error: error?.message || 'Apple login failed',
      };
    }
  };

  // Update user points (optimistic update)
  const updateUserPoints = (newPoints: number) => {
    setUserPoints(newPoints);
    if (user) {
      setUser({ ...user, points: newPoints });
    }
  };

  // Update difficulty level
  const updateDifficultyLevel = async (
    difficultyLevel: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedUser = await authService.updateProfile({
        preferredDifficultyLevel: difficultyLevel as any,
      });
      setUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Update difficulty level error:', error);
      return {
        success: false,
        error: error?.response?.data?.message || 'Update failed',
      };
    }
  };

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const freshUser = await authService.fetchMe();
      setUser(freshUser);
      setUserPoints(freshUser.points || 0);
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
    }
  }, []);

  // Update user profile
  const updateUser = async (
    data: Partial<UpdateProfileRequest>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedUser = await authService.updateProfile(data as UpdateProfileRequest);
      setUser(updatedUser);

      // If native language changed, update app language
      if (data.nativeLanguage && data.nativeLanguage !== i18n.language) {
        console.log('[AuthContext] Changing app language to:', data.nativeLanguage);
        i18n.changeLanguage(data.nativeLanguage);
      }

      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Update user error:', error);
      return {
        success: false,
        error: error?.response?.data?.message || 'Update failed',
      };
    }
  };

  // Logout user
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setUserPoints(0);
  };

  // Delete account permanently (Apple Guideline 5.1.1(v))
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.deleteAccount();
      setUser(null);
      setUserPoints(0);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Delete account error:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Failed to delete account',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userPoints,
        login,
        register,
        resendVerification,
        logout,
        deleteAccount,
        refreshToken,
        loginWithGoogle,
        loginWithApple,
        fetchUserPoints,
        updateUserPoints,
        updateDifficultyLevel,
        refreshUser,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export AuthContext for use in useAuth hook
export default AuthContext;
