import type { HistoryItem } from "@/lib/types";

const HISTORY_KEY = "templatepic.history";
const MAX_HISTORY_ITEMS = 10;

export function loadHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    const lighterItems = items.map(({ imageDataUrl, ...item }) => item).slice(0, MAX_HISTORY_ITEMS);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(lighterItems));
    } catch {
      // Ignore quota failures. Generation still works even if persistence is unavailable.
    }
  }
}

export function addHistoryItem(item: HistoryItem) {
  const current = loadHistory().filter((historyItem) => historyItem.id !== item.id);
  const next = [item, ...current].slice(0, MAX_HISTORY_ITEMS);
  saveHistory(next);
  return next;
}
