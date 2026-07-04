import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  ActiveWorkoutDraft,
  getActiveWorkoutDraft,
  saveActiveWorkoutDraft,
  clearActiveWorkoutDraft,
  hasDraftContent,
} from "../lib/activeWorkoutDraft";
import { useUser } from "./UserContext";

interface ActiveWorkoutContextType {
  draft: ActiveWorkoutDraft | null;
  showContinueButton: boolean;
  isNewWorkoutScreenActive: boolean;
  setNewWorkoutScreenActive: (active: boolean) => void;
  updateDraftSnapshot: (snapshot: Omit<ActiveWorkoutDraft, "savedAt">) => void;
  flushDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;
  reloadDraft: () => Promise<void>;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(
  undefined
);

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [draft, setDraft] = useState<ActiveWorkoutDraft | null>(null);
  const [isNewWorkoutScreenActive, setNewWorkoutScreenActive] = useState(false);
  const snapshotRef = useRef<Omit<ActiveWorkoutDraft, "savedAt"> | null>(null);

  const reloadDraft = useCallback(async () => {
    if (!currentUser) {
      setDraft(null);
      return;
    }
    const loaded = await getActiveWorkoutDraft(currentUser.id);
    setDraft(loaded && hasDraftContent(loaded) ? loaded : null);
  }, [currentUser?.id]);

  useEffect(() => {
    reloadDraft();
  }, [reloadDraft]);

  const updateDraftSnapshot = useCallback(
    (snapshot: Omit<ActiveWorkoutDraft, "savedAt">) => {
      snapshotRef.current = snapshot;
    },
    []
  );

  const flushDraft = useCallback(async () => {
    const snap = snapshotRef.current;
    if (!snap || !currentUser || snap.userId !== currentUser.id) return;
    await saveActiveWorkoutDraft(snap);
    await reloadDraft();
  }, [currentUser?.id, reloadDraft]);

  const clearDraft = useCallback(async () => {
    if (currentUser) {
      await clearActiveWorkoutDraft(currentUser.id);
    }
    snapshotRef.current = null;
    setDraft(null);
  }, [currentUser?.id]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        void flushDraft();
      }
      if (nextState === "active") {
        void reloadDraft();
      }
    };
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, [flushDraft, reloadDraft]);

  const showContinueButton =
    !!draft &&
    hasDraftContent(draft) &&
    !isNewWorkoutScreenActive &&
    !!currentUser &&
    draft.userId === currentUser.id;

  return (
    <ActiveWorkoutContext.Provider
      value={{
        draft,
        showContinueButton,
        isNewWorkoutScreenActive,
        setNewWorkoutScreenActive: setNewWorkoutScreenActive,
        updateDraftSnapshot,
        flushDraft,
        clearDraft,
        reloadDraft,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (context === undefined) {
    throw new Error("useActiveWorkout must be used within ActiveWorkoutProvider");
  }
  return context;
}
