'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useFirebaseAuth } from '@/components/FirebaseProvider';
import {
  subscribeAllProducts,
  subscribeOrders,
  fetchNotificationSettings,
} from '@/lib/firestore-service';
import { playOrderNotificationSound } from '@/lib/sound';
import type { NotificationSettings, Order, Product } from '@/lib/types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/types';

interface AdminDataContextValue {
  products: Product[];
  orders: Order[];
  settings: NotificationSettings;
  loadingProducts: boolean;
  loadingOrders: boolean;
  newOrdersCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  recentAlerts: Order[];
  dismissAlert: (orderId: string) => void;
  refreshSettings: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, authReady } = useFirebaseAuth();
  const [productsState, setProductsState] = useState<{
    uid: string | null;
    items: Product[];
  }>({ uid: null, items: [] });
  const [ordersState, setOrdersState] = useState<{
    uid: string | null;
    items: Order[];
  }>({ uid: null, items: [] });
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<Order[]>([]);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const activeUid = authReady && user && isAdmin ? user.uid : null;

  const refreshSettings = useCallback(async () => {
    if (!activeUid) return;
    try {
      const loaded = await fetchNotificationSettings();
      setSettings(loaded);
      setSoundEnabled(loaded.soundEnabled);
    } catch {
      // Keep default settings if not yet created
    }
  }, [activeUid]);

  useEffect(() => {
    if (!activeUid) {
      return;
    }

    let cancelled = false;
    fetchNotificationSettings()
      .then((loaded) => {
        if (!cancelled) {
          setSettings(loaded);
          setSoundEnabled(loaded.soundEnabled);
        }
      })
      .catch(() => {
        // Keep default settings if not yet created
      });

    const unsubProducts = subscribeAllProducts(
      (items) => {
        setProductsState({ uid: activeUid, items });
      },
      () => {
        setProductsState({ uid: activeUid, items: [] });
      },
    );

    const unsubOrders = subscribeOrders(
      (items) => {
        setOrdersState({ uid: activeUid, items });
      },
      (newOrder) => {
        if (soundEnabledRef.current) {
          playOrderNotificationSound();
        }
        setRecentAlerts((prev) => [newOrder, ...prev].slice(0, 5));
      },
      () => {
        setOrdersState({ uid: activeUid, items: [] });
      },
    );

    return () => {
      cancelled = true;
      unsubProducts();
      unsubOrders();
    };
  }, [activeUid]);

  const products = activeUid && productsState.uid === activeUid ? productsState.items : [];
  const orders = activeUid && ordersState.uid === activeUid ? ordersState.items : [];
  const loadingProducts = Boolean(activeUid) && productsState.uid !== activeUid;
  const loadingOrders = Boolean(activeUid) && ordersState.uid !== activeUid;

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const dismissAlert = useCallback((orderId: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.id !== orderId));
  }, []);

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;

  return (
    <AdminDataContext.Provider
      value={{
        products,
        orders,
        settings,
        loadingProducts,
        loadingOrders,
        newOrdersCount,
        soundEnabled,
        toggleSound,
        recentAlerts,
        dismissAlert,
        refreshSettings,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return ctx;
}
