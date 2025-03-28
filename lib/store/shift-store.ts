import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ShiftState } from "@/lib/types"
import { safeLocalStorage } from "@/lib/utils"

export const useShiftStore = create<ShiftState>()(
  persist(
    (set) => ({
      shifts: [],

      addShift: (shift) => {
        set((state) => ({
          shifts: [...state.shifts, shift],
        }))
      },

      updateShift: (id, updatedShift) => {
        set((state) => ({
          shifts: state.shifts.map((shift) => (shift.id === id ? updatedShift : shift)),
        }))
      },

      deleteShift: (id) => {
        set((state) => ({
          shifts: state.shifts.filter((shift) => shift.id !== id),
        }))
      },
    }),
    {
      name: "work-shifts-storage",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
)

