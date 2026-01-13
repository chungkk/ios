import {useContext} from 'react';
import AuthContext from '../contexts/AuthContext';

/**
 * Custom hook to access AuthContext
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}
