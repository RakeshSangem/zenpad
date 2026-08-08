import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { syncPull, syncPush } from "../lib/api";

const DEBOUNCE_MS = 1500;

const getNoteSignature = (note) =>
  `${note.id}:${note.updatedAt}:${note.isDeleted ? 1 : 0}`;

export function useSyncNotes() {
  const notes = useAppStore((state) => state.notes);
  const pendingDeletes = useAppStore((state) => state.pendingDeletes);
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const storageReady = useAppStore((state) => state.storageReady);
  const syncAccountId = useAppStore((state) => state.syncAccountId);
  const attachSyncAccount = useAppStore((state) => state.attachSyncAccount);
  const mergeRemoteNotes = useAppStore((state) => state.mergeRemoteNotes);
  const acknowledgeDeletes = useAppStore((state) => state.acknowledgeDeletes);

  const [status, setStatus] = useState("idle");
  const [lastError, setLastError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [pullReadyUserId, setPullReadyUserId] = useState(null);
  const [retryTick, setRetryTick] = useState(0);
  const timerRef = useRef(null);
  const inflightRef = useRef(false);
  const retryAfterInflightRef = useRef(false);
  const bootstrappedUserRef = useRef(null);
  // IndexedDB contains the full local workspace; only entries whose version
  // differs from the last pull/push are eligible for a sync request.
  const syncedSignaturesRef = useRef(new Map());

  const canSync = isAuthenticated && storageReady && user;
  const accountMatches =
    canSync && (!syncAccountId || syncAccountId === user.id);

  useEffect(() => {
    if (!canSync) {
      bootstrappedUserRef.current = null;
      syncedSignaturesRef.current.clear();
      setPullReadyUserId(null);
      return;
    }
    if (!syncAccountId) attachSyncAccount(user.id);
  }, [canSync, syncAccountId, user?.id, attachSyncAccount]);

  useEffect(() => {
    if (!canSync || !accountMatches) {
      if (canSync && !accountMatches) {
        const error = new Error(
          "This local workspace is attached to a different account",
        );
        error.code = "account_mismatch";
        setLastError(error);
        setStatus("error");
      }
      return;
    }
    if (bootstrappedUserRef.current === user.id) return;
    bootstrappedUserRef.current = user.id;
    let cancelled = false;
    setStatus("pulling");
    syncPull()
      .then((result) => {
        if (cancelled) return;
        result.notes?.forEach((remote) => {
          syncedSignaturesRef.current.set(
            remote.id,
            `${remote.id}:${remote.updated_at}:${remote.is_deleted ? 1 : 0}`,
          );
        });
        mergeRemoteNotes(result.notes || []);
        setLastResult(result);
        setLastError(null);
        setStatus("idle");
        setPullReadyUserId(user.id);
      })
      .catch((error) => {
        if (cancelled) return;
        setLastError(error);
        setStatus("error");
        bootstrappedUserRef.current = null;
        setPullReadyUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [canSync, accountMatches, user?.id, mergeRemoteNotes]);

  useEffect(() => {
    const outgoing = [...notes, ...pendingDeletes].filter(
      (note) =>
        syncedSignaturesRef.current.get(note.id) !== getNoteSignature(note),
    );
    if (
      !canSync ||
      !accountMatches ||
      pullReadyUserId !== user?.id ||
      !outgoing.length
    )
      return;

    setStatus("pending");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (inflightRef.current) {
        retryAfterInflightRef.current = true;
        return;
      }
      inflightRef.current = true;
      setStatus("pushing");
      try {
        const result = await syncPush(outgoing);
        acknowledgeDeletes(result.accepted || []);
        const accepted = new Set(result.accepted || []);
        outgoing.forEach((note) => {
          if (accepted.has(note.id)) {
            syncedSignaturesRef.current.set(note.id, getNoteSignature(note));
          }
        });
        setLastResult(result);
        setLastError(null);
        setStatus("idle");
      } catch (error) {
        setLastError(error);
        setStatus("error");
      } finally {
        inflightRef.current = false;
        if (retryAfterInflightRef.current) {
          retryAfterInflightRef.current = false;
          setRetryTick((tick) => tick + 1);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [
    notes,
    pendingDeletes,
    canSync,
    accountMatches,
    pullReadyUserId,
    user?.id,
    acknowledgeDeletes,
    retryTick,
  ]);

  return { status, lastError, lastResult };
}
