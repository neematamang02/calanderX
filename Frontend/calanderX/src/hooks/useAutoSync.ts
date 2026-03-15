import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { queryKeys } from "./useApi";

export interface AutoSyncConfig {
  /** Enable/disable auto-sync */
  enabled?: boolean;
  /** Sync interval in milliseconds (default: 5 minutes) */
  interval?: number;
  /** Sync when user focuses window (default: true) */
  syncOnFocus?: boolean;
  /** Sync when user comes back online (default: true) */
  syncOnOnline?: boolean;
  /** Show toast notifications for sync (default: false) */
  showNotifications?: boolean;
  /** Pause sync when user is idle (default: true) */
  pauseOnIdle?: boolean;
  /** Idle timeout in milliseconds (default: 15 minutes) */
  idleTimeout?: number;
  /** Maximum sync interval when using exponential backoff (default: 30 minutes) */
  maxInterval?: number;
  /** Minimum sync interval (default: 1 minute) */
  minInterval?: number;
}

export interface SyncStatus {
  /** Is currently syncing */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncTime: Date | null;
  /** Time since last sync in human-readable format */
  lastSyncFormatted: string;
  /** Number of consecutive errors */
  errorCount: number;
  /** Current sync interval being used */
  currentInterval: number;
  /** Is user idle */
  isIdle: boolean;
  /** Manually trigger a sync */
  sync: () => Promise<void>;
  /** Pause auto-sync */
  pause: () => void;
  /** Resume auto-sync */
  resume: () => void;
}

const DEFAULT_CONFIG: Required<AutoSyncConfig> = {
  enabled: true,
  interval: 5 * 60 * 1000, // 5 minutes
  syncOnFocus: true,
  syncOnOnline: true,
  showNotifications: false,
  pauseOnIdle: true,
  idleTimeout: 15 * 60 * 1000, // 15 minutes
  maxInterval: 30 * 60 * 1000, // 30 minutes
  minInterval: 60 * 1000, // 1 minute
};

/**
 * Smart auto-sync hook for calendar data
 *
 * Features:
 * - Automatic background syncing at configurable intervals
 * - Sync on window focus (when user returns to tab)
 * - Sync when coming back online
 * - Idle detection (pause sync when user inactive)
 * - Exponential backoff on errors
 * - Manual sync trigger
 * - Visual sync status
 *
 * @example
 * ```tsx
 * const { isSyncing, lastSyncFormatted, sync } = useAutoSync({
 *   interval: 3 * 60 * 1000, // 3 minutes
 *   showNotifications: true,
 * });
 *
 * return (
 *   <div>
 *     <button onClick={sync}>Sync Now</button>
 *     <span>Last synced: {lastSyncFormatted}</span>
 *   </div>
 * );
 * ```
 */
export const useAutoSync = (config: AutoSyncConfig = {}): SyncStatus => {
  const queryClient = useQueryClient();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncFormatted, setLastSyncFormatted] = useState("Never");
  const [errorCount, setErrorCount] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(mergedConfig.interval);
  const [isIdle, setIsIdle] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasInitialSyncRunRef = useRef(false);

  /**
   * Update "time ago" string every minute
   */
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastSyncTime) {
        setLastSyncFormatted("Never");
        return;
      }

      const now = Date.now();
      const diff = now - lastSyncTime.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 10) {
        setLastSyncFormatted("Just now");
      } else if (seconds < 60) {
        setLastSyncFormatted(`${seconds} seconds ago`);
      } else if (minutes < 60) {
        setLastSyncFormatted(`${minutes} minute${minutes > 1 ? "s" : ""} ago`);
      } else if (hours < 24) {
        setLastSyncFormatted(`${hours} hour${hours > 1 ? "s" : ""} ago`);
      } else {
        setLastSyncFormatted(`${days} day${days > 1 ? "s" : ""} ago`);
      }
    };

    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, [lastSyncTime]);

  /**
   * Calculate next sync interval with exponential backoff on errors
   */
  const calculateNextInterval = useCallback(
    (errors: number): number => {
      if (errors === 0) {
        return mergedConfig.interval;
      }

      // Exponential backoff: interval * (2 ^ errors)
      const backoffInterval =
        mergedConfig.interval * Math.pow(2, Math.min(errors, 5));

      // Clamp between min and max
      return Math.min(
        Math.max(backoffInterval, mergedConfig.minInterval),
        mergedConfig.maxInterval,
      );
    },
    [mergedConfig.interval, mergedConfig.minInterval, mergedConfig.maxInterval],
  );

  /**
   * Perform sync operation
   */
  const performSync = useCallback(
    async (manual: boolean = false): Promise<void> => {
      if (isSyncing) {
        console.log("[AutoSync] Sync already in progress, skipping");
        return;
      }

      if (!manual && (isPaused || isIdle)) {
        console.log("[AutoSync] Sync paused or idle, skipping");
        return;
      }

      setIsSyncing(true);
      console.log("[AutoSync] Starting sync...");

      try {
        // Invalidate all relevant queries to trigger refetch
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.connectedAccounts,
          }),
          queryClient.invalidateQueries({ queryKey: ["calendars"] }),
          queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
          queryClient.invalidateQueries({ queryKey: ["boardEvents"] }),
        ]);

        // Wait a bit for queries to refetch
        await new Promise((resolve) => setTimeout(resolve, 500));

        setLastSyncTime(new Date());
        setErrorCount(0);
        setCurrentInterval(mergedConfig.interval);

        console.log("[AutoSync] Sync completed successfully");

        if (manual && mergedConfig.showNotifications) {
          toast.success("Calendar synced successfully", {
            position: "bottom-right",
            autoClose: 2000,
          });
        }
      } catch (error) {
        console.error("[AutoSync] Sync failed:", error);

        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);

        const newInterval = calculateNextInterval(newErrorCount);
        setCurrentInterval(newInterval);

        console.log(
          `[AutoSync] Error count: ${newErrorCount}, next interval: ${newInterval}ms`,
        );

        if (manual || mergedConfig.showNotifications) {
          toast.error("Sync failed. Will retry automatically.", {
            position: "bottom-right",
            autoClose: 3000,
          });
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [
      isSyncing,
      isPaused,
      isIdle,
      errorCount,
      queryClient,
      calculateNextInterval,
      mergedConfig.interval,
      mergedConfig.showNotifications,
    ],
  );

  /**
   * Manual sync trigger
   */
  const sync = useCallback(async (): Promise<void> => {
    console.log("[AutoSync] Manual sync triggered");
    await performSync(true);
  }, [performSync]);

  /**
   * Pause auto-sync
   */
  const pause = useCallback(() => {
    console.log("[AutoSync] Paused");
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Resume auto-sync
   */
  const resume = useCallback(() => {
    console.log("[AutoSync] Resumed");
    setIsPaused(false);
  }, []);

  /**
   * Reset idle timer on user activity
   */
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (isIdle) {
      console.log("[AutoSync] User activity detected, resuming");
      setIsIdle(false);
    }

    if (mergedConfig.pauseOnIdle && idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);

      idleTimerRef.current = setTimeout(() => {
        console.log("[AutoSync] User idle, pausing sync");
        setIsIdle(true);
      }, mergedConfig.idleTimeout);
    }
  }, [isIdle, mergedConfig.pauseOnIdle, mergedConfig.idleTimeout]);

  /**
   * Setup auto-sync interval
   */
  useEffect(() => {
    if (!mergedConfig.enabled || isPaused) {
      return;
    }

    console.log(`[AutoSync] Setting up interval: ${currentInterval}ms`);

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      if (!isIdle && !isPaused) {
        performSync(false);
      }
    }, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mergedConfig.enabled, currentInterval, isPaused, isIdle, performSync]);

  /**
   * Sync on window focus
   */
  useEffect(() => {
    if (!mergedConfig.syncOnFocus) {
      return;
    }

    const handleFocus = () => {
      console.log("[AutoSync] Window focused, syncing");
      resetIdleTimer();

      // Only sync if it's been more than 1 minute since last sync
      const timeSinceLastSync = lastSyncTime
        ? Date.now() - lastSyncTime.getTime()
        : Infinity;

      if (timeSinceLastSync > 60000) {
        performSync(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [mergedConfig.syncOnFocus, lastSyncTime, performSync, resetIdleTimer]);

  /**
   * Sync when coming back online
   */
  useEffect(() => {
    if (!mergedConfig.syncOnOnline) {
      return;
    }

    const handleOnline = () => {
      console.log("[AutoSync] Network restored, syncing");
      toast.info("Connection restored. Syncing calendar...", {
        position: "bottom-right",
        autoClose: 2000,
      });
      performSync(false);
    };

    const handleOffline = () => {
      console.log("[AutoSync] Network lost");
      toast.warning("Connection lost. Sync paused.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [mergedConfig.syncOnOnline, performSync]);

  /**
   * Track user activity for idle detection
   */
  useEffect(() => {
    if (!mergedConfig.pauseOnIdle) {
      return;
    }

    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Start idle timer
    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [mergedConfig.pauseOnIdle, resetIdleTimer]);

  /**
   * Initial sync on mount
   */
  useEffect(() => {
    if (!mergedConfig.enabled || hasInitialSyncRunRef.current) {
      return;
    }

    hasInitialSyncRunRef.current = true;
    console.log("[AutoSync] Initial sync");

    // Delay initial sync by 2 seconds to let page load
    const timer = setTimeout(() => {
      performSync(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [mergedConfig.enabled, performSync]);

  return {
    isSyncing,
    lastSyncTime,
    lastSyncFormatted,
    errorCount,
    currentInterval,
    isIdle,
    sync,
    pause,
    resume,
  };
};

/**
 * Hook to use auto-sync with default settings
 * Perfect for most use cases
 */
export const useDefaultAutoSync = () => {
  return useAutoSync({
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    syncOnFocus: true,
    syncOnOnline: true,
    showNotifications: false,
    pauseOnIdle: true,
  });
};

/**
 * Hook for aggressive syncing (frequent updates)
 * Use when real-time updates are critical
 */
export const useAggressiveAutoSync = () => {
  return useAutoSync({
    enabled: true,
    interval: 2 * 60 * 1000, // 2 minutes
    syncOnFocus: true,
    syncOnOnline: true,
    showNotifications: false,
    pauseOnIdle: false, // Don't pause even when idle
    minInterval: 30 * 1000, // Min 30 seconds
  });
};

/**
 * Hook for conservative syncing (battery-friendly)
 * Use on mobile or when minimizing API calls
 */
export const useConservativeAutoSync = () => {
  return useAutoSync({
    enabled: true,
    interval: 15 * 60 * 1000, // 15 minutes
    syncOnFocus: true,
    syncOnOnline: true,
    showNotifications: false,
    pauseOnIdle: true,
    idleTimeout: 5 * 60 * 1000, // Pause after 5 min idle
  });
};
