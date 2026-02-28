import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { generateSecureId } from './utils';

export type QueuedAction = {
  id: string;
  type: 'ADD_CREDENTIAL' | 'REVOKE_CREDENTIAL';
  payload: any;
  timestamp: number;
};

const QUEUED_ACTIONS_KEY = 'offline_queue';

/**
 * Get current network status
 */
export async function getNetworkStatus(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Queue action for later when offline
 */
export async function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  const existing = await getQueuedActions();
  const newAction: QueuedAction = {
    ...action,
    id: generateSecureId(),
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(QUEUED_ACTIONS_KEY, JSON.stringify([...existing, newAction]));
}

/**
 * Get all queued actions
 */
export async function getQueuedActions(): Promise<QueuedAction[]> {
  const stored = await AsyncStorage.getItem(QUEUED_ACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Process queued actions when back online
 * This should be called with the actual action handlers
 */
export async function processQueuedActions(
  handlers?: {
    onAddCredential?: (payload: any) => void;
    onRevokeCredential?: (payload: any) => void;
  }
): Promise<void> {
  const actions = await getQueuedActions();
  
  // Process each action
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'ADD_CREDENTIAL':
          handlers?.onAddCredential?.(action.payload);
          break;
        case 'REVOKE_CREDENTIAL':
          handlers?.onRevokeCredential?.(action.payload);
          break;
        default:
          console.log('Unknown action type:', action.type);
      }
    } catch (e) {
      console.error('Failed to process action:', action.id, e);
    }
  }
  
  // Clear queue after processing
  await AsyncStorage.removeItem(QUEUED_ACTIONS_KEY);
}

/**
 * Clear all queued actions
 */
export async function clearQueuedActions(): Promise<void> {
  await AsyncStorage.removeItem(QUEUED_ACTIONS_KEY);
}

/**
 * Get the count of queued actions
 */
export async function getQueuedActionsCount(): Promise<number> {
  const actions = await getQueuedActions();
  return actions.length;
}

/**
 * Hook to monitor network status and auto-process queue
 */
export function useNetworkStatus(
  handlers?: {
    onAddCredential?: (payload: any) => void;
    onRevokeCredential?: (payload: any) => void;
  }
) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
      setIsChecking(false);
    });

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !isOnline;
      const nowOnline = state.isConnected ?? false;
      
      setIsOnline(nowOnline);
      setIsChecking(false);

      // Process queued actions when coming back online
      if (wasOffline && nowOnline && handlers) {
        processQueuedActions(handlers);
      }
    });

    // Check queue count periodically
    const updateQueueCount = async () => {
      const count = await getQueuedActionsCount();
      setQueueCount(count);
    };
    
    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [handlers]);

  return { isOnline, isChecking, queueCount };
}
