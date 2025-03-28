// Simple in-memory database for PWA offline support
class DB {
  constructor() {
    this.data = {}
    this.init()
  }

  init() {
    if (typeof window !== "undefined") {
      try {
        // Load data from localStorage
        const storedData = localStorage.getItem("schedule-db")
        if (storedData) {
          this.data = JSON.parse(storedData)
        }

        // Verificar si hay datos en los stores de Zustand y migrarlos si es necesario
        this.migrateFromZustandStores()
      } catch (error) {
        console.error("Error initializing DB:", error)
        this.data = {}
      }
    }
  }

  migrateFromZustandStores() {
    try {
      // Migrar datos de los stores de Zustand si existen
      const scheduleStore = localStorage.getItem("work-schedule-storage")
      const shiftStore = localStorage.getItem("work-shifts-storage")
      const employeeStore = localStorage.getItem("work-employees-storage")

      if (scheduleStore) {
        const parsedScheduleStore = JSON.parse(scheduleStore)
        if (parsedScheduleStore.state && parsedScheduleStore.state.savedSchedules) {
          this.data.schedules = parsedScheduleStore.state.savedSchedules
        }
      }

      if (shiftStore) {
        const parsedShiftStore = JSON.parse(shiftStore)
        if (parsedShiftStore.state && parsedShiftStore.state.shifts) {
          this.data.shifts = parsedShiftStore.state.shifts
        }
      }

      if (employeeStore) {
        const parsedEmployeeStore = JSON.parse(employeeStore)
        if (parsedEmployeeStore.state && parsedEmployeeStore.state.employees) {
          this.data.employees = parsedEmployeeStore.state.employees
        }
      }

      this.save()
    } catch (error) {
      console.error("Error migrating data from Zustand stores:", error)
    }
  }

  save() {
    if (typeof window !== "undefined") {
      try {
        // Save data to localStorage
        localStorage.setItem("schedule-db", JSON.stringify(this.data))
      } catch (error) {
        console.error("Error saving DB:", error)

        // Intentar limpiar datos antiguos si el almacenamiento está lleno
        if (
          error instanceof DOMException &&
          (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          this.cleanupOldData()
          try {
            localStorage.setItem("schedule-db", JSON.stringify(this.data))
          } catch (e) {
            console.error("Still couldn't save after cleanup:", e)
          }
        }
      }
    }
  }

  cleanupOldData() {
    // Limpiar datos antiguos si es necesario
    if (this.data.schedules && this.data.schedules.length > 20) {
      // Mantener solo los 20 horarios más recientes
      this.data.schedules = this.data.schedules
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 20)
    }
  }

  // CRUD operations for schedules
  getSchedules() {
    return this.data.schedules || []
  }

  getScheduleById(id) {
    const schedules = this.getSchedules()
    return schedules.find((schedule) => schedule.id === id) || null
  }

  saveSchedule(schedule) {
    const schedules = this.getSchedules()
    const index = schedules.findIndex((s) => s.id === schedule.id)

    if (index >= 0) {
      // Update existing schedule
      schedules[index] = schedule
    } else {
      // Add new schedule
      schedules.push(schedule)
    }

    this.data.schedules = schedules
    this.save()
    return schedule
  }

  deleteSchedule(id) {
    const schedules = this.getSchedules()
    this.data.schedules = schedules.filter((schedule) => schedule.id !== id)
    this.save()
  }

  // CRUD operations for shifts
  getShifts() {
    return this.data.shifts || []
  }

  saveShift(shift) {
    const shifts = this.getShifts()
    const index = shifts.findIndex((s) => s.id === shift.id)

    if (index >= 0) {
      shifts[index] = shift
    } else {
      shifts.push(shift)
    }

    this.data.shifts = shifts
    this.save()
    return shift
  }

  deleteShift(id) {
    const shifts = this.getShifts()
    this.data.shifts = shifts.filter((shift) => shift.id !== id)
    this.save()
  }

  // CRUD operations for employees
  getEmployees() {
    return this.data.employees || []
  }

  saveEmployee(employee) {
    const employees = this.getEmployees()
    const index = employees.findIndex((e) => e.id === employee.id)

    if (index >= 0) {
      employees[index] = employee
    } else {
      employees.push(employee)
    }

    this.data.employees = employees
    this.save()
    return employee
  }

  deleteEmployee(id) {
    const employees = this.getEmployees()
    this.data.employees = employees.filter((employee) => employee.id !== id)
    this.save()
  }

  // Clear all data
  clearAll() {
    this.data = {}
    this.save()
  }
}

// Create a singleton instance
const db = typeof window !== "undefined" ? new DB() : null

export default db

