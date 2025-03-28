import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import type { Schedule, ScheduleState } from "@/lib/types"
import { safeLocalStorage } from "@/lib/utils"
import db from "@/lib/db"

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],
      currentSchedule: null,
      savedSchedules: [],

      initializeSchedule: () => {
        // لا نقوم بإنشاء أي جداول افتراضية
        // فقط نقوم بتهيئة المخزن بقائمة فارغة
        set({
          schedules: [],
          currentSchedule: null,
          savedSchedules: [],
        })

        // Guardar en la base de datos local que está vacía
        if (db) {
          db.clearAll()
        }
      },

      createNewSchedule: (schedule) => {
        const newSchedule = {
          ...schedule,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }

        // Save to DB
        if (db) {
          db.saveSchedule(newSchedule)
        }

        set((state) => ({
          currentSchedule: newSchedule,
          schedules: [...state.schedules, newSchedule],
          savedSchedules: [...state.savedSchedules, newSchedule],
        }))
      },

      // Confirmar que la función saveSchedule guarda correctamente los datos
      saveSchedule: (schedule) => {
        // Save to DB
        if (db) {
          db.saveSchedule(schedule)
        }

        set((state) => {
          const updatedSchedules = state.schedules.map((s) => (s.id === schedule.id ? schedule : s))

          // Asegurarse de que el horario se guarde en savedSchedules si no existe
          const updatedSavedSchedules = [...state.savedSchedules]
          const existingIndex = updatedSavedSchedules.findIndex((s) => s.id === schedule.id)

          if (existingIndex >= 0) {
            updatedSavedSchedules[existingIndex] = schedule
          } else {
            updatedSavedSchedules.push(schedule)
          }

          return {
            schedules: updatedSchedules,
            currentSchedule: schedule,
            savedSchedules: updatedSavedSchedules,
          }
        })
      },

      updateSchedule: (id, updatedSchedule) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => (schedule.id === id ? updatedSchedule : schedule))

          const updatedSavedSchedules = state.savedSchedules.map((schedule) =>
            schedule.id === id ? updatedSchedule : schedule,
          )

          // Save to DB
          if (db) {
            db.saveSchedule(updatedSchedule)
          }

          return {
            schedules: updatedSchedules,
            savedSchedules: updatedSavedSchedules,
            currentSchedule: state.currentSchedule?.id === id ? updatedSchedule : state.currentSchedule,
          }
        })
      },

      exportSchedule: (id) => {
        const { schedules } = get()
        const schedule = schedules.find((s) => s.id === id)

        if (schedule) {
          const scheduleData = JSON.stringify(schedule)

          // In a real app, this would trigger a download
          console.log("Exporting schedule:", scheduleData)

          // For demo purposes, we'll just add it to localStorage
          try {
            localStorage.setItem(`exported_schedule_${id}`, scheduleData)
          } catch (error) {
            console.error("Error exporting schedule:", error)
          }
        }
      },

      importSchedule: (scheduleData) => {
        try {
          const schedule = JSON.parse(scheduleData) as Schedule

          if (!schedule.id) {
            schedule.id = uuidv4()
          }

          // Save to DB
          if (db) {
            db.saveSchedule(schedule)
          }

          set((state) => ({
            schedules: [...state.schedules, schedule],
            currentSchedule: schedule,
            savedSchedules: [...state.savedSchedules, schedule],
          }))
        } catch (error) {
          console.error("Error importing schedule:", error)
        }
      },

      loadScheduleFromHistory: (id) => {
        const { savedSchedules } = get()
        const schedule = savedSchedules.find((s) => s.id === id)

        if (schedule) {
          set({ currentSchedule: schedule })
        }
      },

      deleteScheduleFromHistory: (id) => {
        // Delete from DB
        if (db) {
          db.deleteSchedule(id)
        }

        set((state) => ({
          savedSchedules: state.savedSchedules.filter((s) => s.id !== id),
          schedules: state.schedules.filter((s) => s.id !== id),
          currentSchedule: state.currentSchedule?.id === id ? null : state.currentSchedule,
        }))
      },

      resetStore: () => {
        // Clear DB
        if (db) {
          db.clearAll()
        }

        set({
          schedules: [],
          currentSchedule: null,
          savedSchedules: [],
        })
      },

      addComment: (scheduleId, comment) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              const updatedSchedule = {
                ...schedule,
                comments: [...(schedule.comments || []), comment],
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId
              ? {
                  ...state.currentSchedule,
                  comments: [...(state.currentSchedule.comments || []), comment],
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },

      updateComment: (scheduleId, commentId, comment) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              const updatedSchedule = {
                ...schedule,
                comments: schedule.comments.map((c) => (c.id === commentId ? comment : c)),
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId
              ? {
                  ...state.currentSchedule,
                  comments: state.currentSchedule.comments.map((c) => (c.id === commentId ? comment : c)),
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },

      deleteComment: (scheduleId, commentId) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              const updatedSchedule = {
                ...schedule,
                comments: schedule.comments.filter((c) => c.id !== commentId),
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId
              ? {
                  ...state.currentSchedule,
                  comments: state.currentSchedule.comments.filter((c) => c.id !== commentId),
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },

      toggleCommentCompletion: (scheduleId, commentId) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              const updatedSchedule = {
                ...schedule,
                comments: schedule.comments.map((c) =>
                  c.id === commentId ? { ...c, isCompleted: !c.isCompleted } : c,
                ),
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId
              ? {
                  ...state.currentSchedule,
                  comments: state.currentSchedule.comments.map((c) =>
                    c.id === commentId ? { ...c, isCompleted: !c.isCompleted } : c,
                  ),
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },

      togglePinDay: (scheduleId, date) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              const pins = { ...(schedule.pins || {}) }
              pins[date] = !pins[date]

              const updatedSchedule = {
                ...schedule,
                pins,
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId
              ? {
                  ...state.currentSchedule,
                  pins: {
                    ...(state.currentSchedule.pins || {}),
                    [date]: !(state.currentSchedule.pins && state.currentSchedule.pins[date]),
                  },
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },

      assignShift: (scheduleId, date, shiftId) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              const updatedSchedule = {
                ...schedule,
                assignments: {
                  ...(schedule.assignments || {}),
                  [date]: shiftId,
                },
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId
              ? {
                  ...state.currentSchedule,
                  assignments: {
                    ...(state.currentSchedule.assignments || {}),
                    [date]: shiftId,
                  },
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },

      removeShift: (scheduleId, date) => {
        set((state) => {
          const updatedSchedules = state.schedules.map((schedule) => {
            if (schedule.id === scheduleId && schedule.assignments) {
              const assignments = { ...schedule.assignments }
              delete assignments[date]

              const updatedSchedule = {
                ...schedule,
                assignments,
              }

              // Save to DB
              if (db) {
                db.saveSchedule(updatedSchedule)
              }

              return updatedSchedule
            }
            return schedule
          })

          const updatedCurrentSchedule =
            state.currentSchedule && state.currentSchedule.id === scheduleId && state.currentSchedule.assignments
              ? {
                  ...state.currentSchedule,
                  assignments: Object.fromEntries(
                    Object.entries(state.currentSchedule.assignments).filter(([key]) => key !== date),
                  ),
                }
              : state.currentSchedule

          return {
            schedules: updatedSchedules,
            currentSchedule: updatedCurrentSchedule,
          }
        })
      },
    }),
    {
      name: "work-schedule-storage",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
)

