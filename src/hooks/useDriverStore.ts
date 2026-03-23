'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HubViagem,
  HUB_CENTRAL_URL,
  detectTipo,
  calcDriverPrice,
  cleanHora,
} from '@/lib/trips';

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
  lastSyncTime: string | null;
  nameplateOpen: boolean;
  nameplateName: string;
  stats: DriverStats;
  sortedViagens: HubViagem[];
  setDriverName: (name: string) => void;
  loadDate: (dateStr: string) => void;
  syncViagens: () => Promise<void>;
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
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState('');

  const gasUrl = HUB_CENTRAL_URL;

  // Keep refs so the interval callback always reads the latest values
  const driverNameRef = useRef(driverName);
  driverNameRef.current = driverName;
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  // ── Sync ────────────────────────────────────────────────

  const syncViagens = useCallback(async () => {
    const name = driverNameRef.current;
    if (!name) return;

    setIsLoading(true);
    try {
      const dateParam = selectedDateRef.current || '';
      const url = `${gasUrl}?action=viagens&t=${Date.now()}${dateParam ? `&data=${encodeURIComponent(dateParam)}` : ''}`;
      const res = await fetch(url);
      const raw: HubViagem[] = await res.json();

      const me = normalize(name);
      const filtered = raw.filter((v) => {
        const d = normalize(v.driver || '');
        return d === me || d.includes(me) || me.includes(d);
      });

      setViagens(filtered);

      const now = new Date().toLocaleTimeString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSyncTime(now);
      try {
        localStorage.setItem('hub_driver_last_sync', now);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('[useDriverStore] sync error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gasUrl]);

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
        const url = `${gasUrl}?action=darBaixa&id=${encodeURIComponent(id)}&rowIndex=${encodeURIComponent(rowIndex)}&cardId=${encodeURIComponent(cardId)}&t=${Date.now()}`;
        await fetch(url);
        // Refresh list after marking done
        await syncViagens();
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
      const tipo = detectTipo(v.origin, v.flight);
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

    // Auto-sync every 3 minutes
    const interval = setInterval(() => {
      if (driverNameRef.current) {
        syncViagens();
      }
    }, 180_000);

    return () => clearInterval(interval);
  }, [syncViagens]);

  // ── Return ──────────────────────────────────────────────

  return {
    driverName,
    gasUrl,
    viagens,
    selectedDate,
    isLoading,
    lastSyncTime,
    nameplateOpen,
    nameplateName,
    stats,
    sortedViagens,
    setDriverName,
    loadDate,
    syncViagens,
    darBaixa,
    showNameplate,
    closeNameplate,
  };
}
