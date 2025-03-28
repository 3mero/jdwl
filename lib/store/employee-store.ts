import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { EmployeeState } from "@/lib/types"
import { safeLocalStorage } from "@/lib/utils"

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set) => ({
      employees: [],

      addEmployee: (employee) => {
        set((state) => ({
          employees: [...state.employees, employee],
        }))
      },

      updateEmployee: (id, updatedEmployee) => {
        set((state) => ({
          employees: state.employees.map((employee) => (employee.id === id ? updatedEmployee : employee)),
        }))
      },

      deleteEmployee: (id) => {
        set((state) => ({
          employees: state.employees.filter((employee) => employee.id !== id),
        }))
      },
    }),
    {
      name: "work-employees-storage",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
)

