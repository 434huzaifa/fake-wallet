'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateWalletBalance } from '../store/slices/walletSlice';

interface WalletUpdate {
  _id: string;
  name: string;
  icon: string;
  backgroundColor: string;
  balance: number;
  userId: string;
  createdBy: string;
  userRole?: 'owner' | 'viewer' | 'partner';
  createdAt: string;
  updatedAt: string;
}

interface WalletUpdatesResponse {
  wallets: WalletUpdate[];
  lastUpdate: string;
  hasUpdates: boolean;
}

export function useWalletUpdates(enabled: boolean = true) {
  const [lastUpdate, setLastUpdate] = useState<string>(() => new Date().toISOString());
  const [isPolling, setIsPolling] = useState(false);
  const dispatch = useAppDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUpdates = async () => {
    if (isPolling) return;
    
    setIsPolling(true);
    try {
      const response = await fetch(`/api/wallets/updates?lastUpdate=${encodeURIComponent(lastUpdate)}`);
      const result = await response.json();

      if (result.isSuccess && result.data.hasUpdates) {
        const { wallets, lastUpdate: newLastUpdate } = result.data as WalletUpdatesResponse;
        
        // Update Redux store with new wallet balances - preserve userRole and other fields
        wallets.forEach((wallet) => {
          dispatch(updateWalletBalance({
            walletId: wallet._id,
            balance: wallet.balance,
            updatedAt: wallet.updatedAt,
            preserveUserRole: true
          }));
        });

        setLastUpdate(newLastUpdate);
        return wallets;
      }
    } catch (error) {
      console.error('Error fetching wallet updates:', error);
    } finally {
      setIsPolling(false);
    }
    
    return [];
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchUpdates();

    // Set up polling every 10 seconds
    intervalRef.current = setInterval(fetchUpdates, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, lastUpdate]);

  return {
    fetchUpdates,
    isPolling,
    lastUpdate
  };
}

interface WalletEntryUpdate {
  _id: string;
  amount: number;
  type: 'add' | 'subtract';
  description: string;
  walletId: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletEntryUpdatesResponse {
  wallet: WalletUpdate | null;
  entries: WalletEntryUpdate[];
  lastUpdate: string;
  hasUpdates: boolean;
}

export function useWalletEntryUpdates(walletId: string, enabled: boolean = true) {
  const [lastUpdate, setLastUpdate] = useState<string>(() => new Date().toISOString());
  const [isPolling, setIsPolling] = useState(false);
  const [newEntries, setNewEntries] = useState<WalletEntryUpdate[]>([]);
  const dispatch = useAppDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUpdates = async () => {
    if (isPolling || !walletId) return;
    
    setIsPolling(true);
    try {
      const response = await fetch(`/api/wallets/${walletId}/updates?lastUpdate=${encodeURIComponent(lastUpdate)}`);
      const result = await response.json();

      if (result.isSuccess && result.data.hasUpdates) {
        const { wallet, entries, lastUpdate: newLastUpdate } = result.data as WalletEntryUpdatesResponse;
        
        // Update wallet balance if changed - preserve userRole
        if (wallet) {
          dispatch(updateWalletBalance({
            walletId: wallet._id,
            balance: wallet.balance,
            updatedAt: wallet.updatedAt,
            preserveUserRole: true
          }));
        }

        // Add new entries to state (prevent duplicates)
        if (entries.length > 0) {
          setNewEntries(prev => {
            const existingIds = new Set(prev.map(entry => entry._id));
            const newUniqueEntries = entries.filter(entry => !existingIds.has(entry._id));
            return [...newUniqueEntries, ...prev];
          });
        }

        setLastUpdate(newLastUpdate);
        return { wallet, entries };
      }
    } catch (error) {
      console.error('Error fetching wallet entry updates:', error);
    } finally {
      setIsPolling(false);
    }
    
    return { wallet: null, entries: [] };
  };

  const clearNewEntries = () => {
    setNewEntries([]);
  };

  useEffect(() => {
    if (!enabled || !walletId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset state when wallet changes
    setNewEntries([]);
    setLastUpdate(new Date().toISOString());

    // Initial fetch
    fetchUpdates();

    // Set up polling every 10 seconds
    intervalRef.current = setInterval(fetchUpdates, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, walletId]);

  return {
    fetchUpdates,
    isPolling,
    lastUpdate,
    newEntries,
    clearNewEntries
  };
}