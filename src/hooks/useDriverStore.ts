'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HubViagem,
  HUB_CENTRAL_URL,
  detectTipo,
  calcDriverPrice,
  cleanHora,
} from '@/lib/trips';
import { getCachedTrips, setCachedTrips, getCacheTimestamp } from '@/lib/trips-cache';

// ── Helpers ─────────────────────────────────────────────────

const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// ── Types ───────────────────────────────────────────────────

interface DriverStats {
  total: number;
  chegadas: number;
  recolhas: number;
  totalPay: number;
}

interface DriverStore {
  driverName: string;
  gasUrl: string;
  viagens: HubViagem[];
  selectedDate: string;
  isLoading: boolean;
  isFromCache: boolean;
  lastSyncTime: string | null;
  cacheAge: string | null;
  nameplateOpen: boolean;
  nameplateName: string;
  stats: DriverStats;
  sortedViagens: HubViagem[];
  backgroundRefreshing: boolean;
  setDriverName: (name: string) => void;
  loadDate: (dateStr: string) => void;
  syncViagens: () => Promise<void>;
  syncViagensSilent: () => Promise<void>;
  darBaixa: (id: string, rowIndex: string, cardId: string) => Promise<void>;
  showNameplate: (name: string) => void;
  closeNameplate: () => void;
}

// ── Hook ────────────────────────────────────────────────────

export function useDriverStore(): DriverStore {
  const [driverName, setDriverNameState] = useState('');
  const [viagens, setViagens] = useState<HubViagem[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [cacheAge, setCacheAge] = useState<string | null>(null);
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState('');
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

  const gasUrl = HUB_CENTRAL_URL;

  // Track previous payload to only re-render on real changes
  const prevViagensKeyRef = useRef('');

  // Keep refs so the interval callback always reads the latest values
  const driverNameRef = useRef(driverName);
  driverNameRef.current = driverName;
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  // ── Sync ────────────────────────────────────────────────

  const syncViagensInternal = useCallback(async (silent: boolean) => {
    const name = driverNameRef.current;
    if (!name) return;

    // Load from cache first (instant) — only on initial load
    const dateKey = selectedDateRef.current || 'today';
    if (!silent) {
      const cached = getCachedTrips<HubViagem[]>(dateKey + ':' + normalize(name));
      if (cached && viagens.length === 0) {
        setViagens(cached.data);
        setIsFromCache(true);
        setCacheAge(cached.age);
      }
    }

    if (silent) setBackgroundRefreshing(true);
    else setIsLoading(true);

    try {
      const dateParam = selectedDateRef.current || '';
      const url = `${gasUrl}?action=viagens&t=${Date.now()}${dateParam ? `&data=${encodeURIComponent(dateParam)}` : ''}`;
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const raw: HubViagem[] = Array.isArray(json) ? json : (json.viagens || []);

      const me = normalize(name);
      const filtered = raw.filter((v) => {
        const d = normalize(v.driver || '');
        return d === me || d.includes(me) || me.includes(d);
      });

      // Only update state if data actually changed
      const key = JSON.stringify(
        filtered.map((v) => `${v.id}|${v.statusMotorista || ''}|${v.status || ''}|${v.statusVoo || ''}|${v.etaChegada || ''}`)
      );
      const changed = key !== prevViagensKeyRef.current;

      if (changed) {
        prevViagensKeyRef.current = key;
        setViagens(filtered);
        setIsFromCache(false);
        setCacheAge(null);
        setCachedTrips(filtered, dateKey + ':' + normalize(name));

        const now = new Date().toLocaleTimeString('pt-PT', {
          timeZone: 'Europe/Lisbon',
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastSyncTime(now);
        try { localStorage.setItem('hub_driver_last_sync', now); } catch { /* */ }
      }
    } catch (err) {
      console.error('[useDriverStore] sync error:', err);
    } finally {
      if (silent) setBackgroundRefreshing(false);
      else setIsLoading(false);
    }
  }, [gasUrl, viagens.length]);

  const syncViagens = useCallback(() => syncViagensInternal(false), [syncViagensInternal]);
  const syncViagensSilent = useCallback(() => syncViagensInternal(true), [syncViagensInternal]);

  // ── Actions ─────────────────────────────────────────────

  const setDriverName = useCallback((name: string) => {
    setDriverNameState(name);
    try {
      localStorage.setItem('hub_driver_name', name);
    } catch {
      // ignore
    }
  }, []);

  const loadDate = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      // selectedDateRef will update on next render; force sync with the new value
      selectedDateRef.current = dateStr;
      syncViagens();
    },
    [syncViagens],
  );

  const darBaixa = useCallback(
    async (id: string, rowIndex: string, cardId: string) => {
      try {
        const url = `${gasUrl}?action=completar&id=${encodeURIComponent(id)}&row=${encodeURIComponent(rowIndex)}&t=${Date.now()}`;
        const res = await fetch(url, { redirect: 'follow' });
        const data = await res.json();
        if (data.success) {
          // Mark locally as done before re-syncing
          setViagens((prev) =>
            prev.map((v) => {
              const vId = v.id || (v.client || '').replace(/\W/g, '');
              return String(vId) === String(cardId)
                ? { ...v, concluida: true, status: 'CONCLUIDA' }
                : v;
            }),
          );
        } else {
          alert('Erro: ' + (data.error || 'Não foi possível dar baixa'));
        }
      } catch (err) {
        console.error('[useDriverStore] darBaixa error:', err);
      }
    },
    [gasUrl, syncViagens],
  );

  const showNameplate = useCallback((name: string) => {
    setNameplateName(name);
    setNameplateOpen(true);
  }, []);

  const closeNameplate = useCallback(() => {
    setNameplateOpen(false);
    setNameplateName('');
  }, []);

  // ── Computed ────────────────────────────────────────────

  const stats: DriverStats = useMemo(() => {
    let chegadas = 0;
    let recolhas = 0;
    let totalPay = 0;

    for (const v of viagens) {
      const tipo = detectTipo(v.origin, v.flight, v.type);
      if (tipo === 'CHEGADA') chegadas++;
      else if (tipo === 'RECOLHA') recolhas++;
      totalPay += calcDriverPrice(v.platform);
    }

    return { total: viagens.length, chegadas, recolhas, totalPay };
  }, [viagens]);

  const sortedViagens: HubViagem[] = useMemo(() => {
    return [...viagens].sort((a, b) => {
      const ta = cleanHora(a.pickupTime);
      const tb = cleanHora(b.pickupTime);
      return ta.localeCompare(tb);
    });
  }, [viagens]);

  // ── Mount: load from localStorage, initial sync, auto-sync ──

  useEffect(() => {
    let name = '';
    try {
      name = localStorage.getItem('hub_driver_name') || '';
      const savedSync = localStorage.getItem('hub_driver_last_sync');
      if (savedSync) setLastSyncTime(savedSync);
    } catch {
      // ignore
    }

    if (name) {
      setDriverNameState(name);
      driverNameRef.current = name;
      // Trigger initial sync after setting the name
      syncViagens();
    }

    // Silent auto-sync every 60s, only when tab is visible (no spinner, no flicker)
    const interval = setInterval(() => {
      if (driverNameRef.current && document.visibilityState === 'visible') {
        syncViagensSilent();
      }
    }, 60_000);

    // Sync immediately when tab becomes visible again (silent)
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && driverNameRef.current) {
        syncViagensSilent();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [syncViagens, syncViagensSilent]);

  // ── Return ──────────────────────────────────────────────

  return {
    driverName,
    gasUrl,
    viagens,
    selectedDate,
    isLoading,
    isFromCache,
    lastSyncTime,
    cacheAge,
    nameplateOpen,
    nameplateName,
    stats,
    sortedViagens,
    backgroundRefreshing,
    setDriverName,
    loadDate,
    syncViagens,
    syncViagensSilent,
    darBaixa,
    showNameplate,
    closeNameplate,
  };
}
