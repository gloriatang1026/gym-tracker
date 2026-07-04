import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  UserProfile,
  Workout,
  getProfiles,
  saveProfiles,
  getLastSelectedUser,
  setLastSelectedUser,
  getWorkouts,
} from "../lib/storage";

interface UserContextType {
  profiles: UserProfile[];
  currentUser: UserProfile | null;
  workouts: Workout[];
  isLoading: boolean;
  selectUser: (userId: string) => Promise<void>;
  switchProfile: () => void;
  updateProfile: (profile: UserProfile) => Promise<void>;
  addProfile: (profile: UserProfile) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  refreshWorkouts: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const loadedProfiles = await getProfiles();
      setProfiles(loadedProfiles);

      const lastUserId = await getLastSelectedUser();
      if (lastUserId) {
        const existingUser = loadedProfiles.find((profile) => profile.id === lastUserId);
        if (existingUser) {
          const userWorkouts = await getWorkouts(existingUser.id);
          setCurrentUser(existingUser);
          setWorkouts(userWorkouts);
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = async (userId: string) => {
    const user = profiles.find((p) => p.id === userId);
    if (user) {
      setCurrentUser(user);
      await setLastSelectedUser(userId);
      const userWorkouts = await getWorkouts(userId);
      setWorkouts(userWorkouts);
    }
  };

  const switchProfile = () => {
    setCurrentUser(null);
    setWorkouts([]);
  };

  const updateProfile = async (updatedProfile: UserProfile) => {
    const updatedProfiles = profiles.map((p) =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    setProfiles(updatedProfiles);
    await saveProfiles(updatedProfiles);
    if (currentUser?.id === updatedProfile.id) {
      setCurrentUser(updatedProfile);
    }
  };

  const addProfile = async (profile: UserProfile) => {
    if (profiles.length >= 4) return;
    const updatedProfiles = [...profiles, profile];
    setProfiles(updatedProfiles);
    await saveProfiles(updatedProfiles);
  };

  const deleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) return;
    const updatedProfiles = profiles.filter((p) => p.id !== profileId);
    setProfiles(updatedProfiles);
    await saveProfiles(updatedProfiles);
    if (currentUser?.id === profileId) {
      setCurrentUser(null);
    }
  };

  const refreshWorkouts = useCallback(async () => {
    if (currentUser) {
      const userWorkouts = await getWorkouts(currentUser.id);
      setWorkouts(userWorkouts);
    }
  }, [currentUser?.id]);

  return (
    <UserContext.Provider
      value={{
        profiles,
        currentUser,
        workouts,
        isLoading,
        selectUser,
        switchProfile,
        updateProfile,
        addProfile,
        deleteProfile,
        refreshWorkouts,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
