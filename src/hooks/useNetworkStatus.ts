import { useState, useEffect } from 'react';
// import NetInfo from '@react-native-community/netinfo'; // Will be installed later

/**
 * Network Status Hook
 * Wrapper for @react-native-community/netinfo
 * Detects online/offline state and connection type
 */

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null; // 'wifi', 'cellular', 'none', etc.
}

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    // TODO: Implement actual NetInfo integration when package is installed
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setNetworkState({
    //     isConnected: state.isConnected,
    //     isInternetReachable: state.isInternetReachable,
    //     type: state.type,
    //   });
    // });

    // Mock implementation for development
    console.log('Mock: Network status monitoring active');
    
    // Assume online by default
    setNetworkState({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });

    // Return cleanup function
    // return () => {
    //   unsubscribe();
    // };
  }, []);

  /**
   * Manually refresh network state
   */
  const refresh = async (): Promise<void> => {
    try {
      // TODO: Implement when NetInfo is installed
      // const state = await NetInfo.fetch();
      // setNetworkState({
      //   isConnected: state.isConnected,
      //   isInternetReachable: state.isInternetReachable,
      //   type: state.type,
      // });
      
      console.log('Mock: Refreshing network state');
    } catch (error) {
      console.error('Failed to refresh network state:', error);
    }
  };

  return {
    // State
    isConnected: networkState.isConnected,
    isInternetReachable: networkState.isInternetReachable,
    connectionType: networkState.type,
    networkState,

    // Actions
    refresh,

    // Computed
    isOnline: networkState.isConnected === true && networkState.isInternetReachable === true,
    isOffline: networkState.isConnected === false || networkState.isInternetReachable === false,
    isWifi: networkState.type === 'wifi',
    isCellular: networkState.type === 'cellular',
  };
};

export default useNetworkStatus;
