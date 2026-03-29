import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VehicleWithDetails } from "./mock-data";

interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  roles: string[];
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token: token || null, isAuthenticated: !!user }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "arscars-auth" }
  )
);

interface SearchState {
  selectedVehicle: VehicleWithDetails | null;
  mapCenter: { lat: number; lon: number };
  zoom: number;
  filters: {
    vehicleClassIds?: number[];
    transmissionIds?: number[];
    fuelTypeIds?: number[];
    minPrice?: number;
    maxPrice?: number;
    location?: { lat: number; lon: number; address?: string };
  };
  setFilters: (f: Partial<SearchState["filters"]>) => void;
  setSelectedVehicle: (v: VehicleWithDetails | null) => void;
  setZoom: (z: number) => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  selectedVehicle: null,
  mapCenter: { lat: 55.1644, lon: 61.4368 },
  zoom: 11,
  filters: { location: { lat: 55.1644, lon: 61.4368, address: "Челябинск" } },
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setSelectedVehicle: (v) => set({ selectedVehicle: v }),
  setZoom: (z) => set({ zoom: z }),
  resetFilters: () => set({ filters: { location: { lat: 55.1644, lon: 61.4368, address: "Челябинск" } } }),
}));
