"use client"

import { useEffect, useState } from "react"
import { ScheduleGrid } from "@/components/schedule-grid"
import { ScheduleViewSelector } from "@/components/schedule-view-selector"
import { useScheduleStore } from "@/lib/store/schedule-store"
import { useShiftStore } from "@/lib/store/shift-store"
import { useEmployeeStore } from "@/lib/store/employee-store"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, RefreshCw, Users, Calendar, ChevronRight, X, Info } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

export default function HomePage() {
  const {
    initializeSchedule,
    currentSchedule,
    createNewSchedule,
    updateSchedule,
    loadScheduleFromHistory,
    savedSchedules,
    deleteScheduleFromHistory,
    resetStore,
    saveSchedule,
  } = useScheduleStore()
  const { shifts } = useShiftStore()
  const { employees, deleteEmployee } = useEmployeeStore()

  // Setup wizard states
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [setupStep, setSetupStep] = useState(1)
  const [scheduleName, setScheduleName] = useState("جدول جديد")
  const [startDate, setStartDate] = useState(new Date())
  const [workDays, setWorkDays] = useState(1)
  const [workColor, setWorkColor] = useState("#2E7D32") // أخضر غامق
  const [offDays, setOffDays] = useState(3)
  const [offColor, setOffColor] = useState("#FFFFFF") // أبيض
  const [months, setMonths] = useState(12)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState("general")

  // Add after other state declarations
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [employeeName, setEmployeeName] = useState("")
  const [employeePosition, setEmployeePosition] = useState("")

  // Add a new state variable for maximum shifts per week
  const [maxShiftsPerWeek, setMaxShiftsPerWeek] = useState(5)

  // تعديل نموذج إضافة الموظف ليكون مشابهًا للمعالج الأولي
  const [employeeSetupStep, setEmployeeSetupStep] = useState(1)
  const [employeeWorkDays, setEmployeeWorkDays] = useState(1)
  const [employeeOffDays, setEmployeeOffDays] = useState(3)
  const [employeeWorkColor, setEmployeeWorkColor] = useState("#4CAF50")
  const [employeeOffColor, setEmployeeOffColor] = useState("#FFFFFF")
  const [employeeMonths, setEmployeeMonths] = useState(3)
  const [employeeStartDate, setEmployeeStartDate] = useState(new Date())
  const [scheduleViewMode, setScheduleViewMode] = useState("cards") // "cards", "arrows", "all"

  // Flag to prevent infinite updates
  const [isInitialized, setIsInitialized] = useState(false)

  // Corregido: useEffect para evitar bucles infinitos
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      // Marcar como inicializado para evitar múltiples ejecuciones
      setIsInitialized(true)

      // Verificar si es la primera visita
      const isFirstVisit = !localStorage.getItem("schedule-visited")

      if (isFirstVisit) {
        localStorage.setItem("schedule-visited", "true")
        setShowSetupWizard(true)
      }

      // Cargar el modo de visualización guardado
      const storedViewMode = localStorage.getItem("schedule-view-mode")
      if (storedViewMode) {
        setScheduleViewMode(storedViewMode)
      }

      // Solo inicializar si no hay horarios guardados
      if (!savedSchedules || savedSchedules.length === 0) {
        initializeSchedule()
      }
    }
  }, [isInitialized, initializeSchedule, savedSchedules])

  // Efecto separado para cargar el último horario
  useEffect(() => {
    // Solo intentar cargar un horario si no hay uno activo y hay horarios guardados
    if (isInitialized && !currentSchedule && savedSchedules && savedSchedules.length > 0) {
      loadScheduleFromHistory(savedSchedules[savedSchedules.length - 1].id)
    }
  }, [isInitialized, currentSchedule, savedSchedules, loadScheduleFromHistory])

  // حفظ وضع العرض عند تغييره
  const handleViewModeChange = (mode: string) => {
    setScheduleViewMode(mode)
    localStorage.setItem("schedule-view-mode", mode)
  }

  const handleCreateFromWizard = () => {
    createNewSchedule({
      name: scheduleName || "جدول جديد",
      startDate: startDate.toISOString(),
      months: months,
      workDays: [
        { type: "work", count: workDays, color: workColor },
        { type: "off", count: offDays, color: offColor },
      ],
      notes: {},
      pins: {},
      monthColors: {},
      backgroundColor: "#ffffff",
      employeeName: scheduleName,
      comments: [],
      showComments: true,
      assignments: {},
    })
    setShowSetupWizard(false)
  }

  // دالة حفظ الإعدادات
  const handleSaveSettings = () => {
    try {
      if (currentSchedule) {
        // تحديث الجدول الحالي
        const updatedSchedule = {
          ...currentSchedule,
          startDate: startDate.toISOString(),
          months: months,
          workDays: [
            { type: "work", count: workDays, color: workColor },
            { type: "off", count: offDays, color: offColor },
          ],
        }

        saveSchedule(updatedSchedule)

        // حفظ وضع العرض
        localStorage.setItem("schedule-view-mode", scheduleViewMode)

        // إغلاق لوحة الإعدادات
        setShowSettingsPanel(false)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("حدث خطأ أثناء حفظ الإعدادات")
    }
  }

  // دالة إضافة موظف جديد
  const handleAddEmployee = () => {
    if (employeeName.trim()) {
      const employeeId = uuidv4()

      // إضافة الموظف
      useEmployeeStore.getState().addEmployee({
        id: employeeId,
        name: employeeName,
        position: employeePosition || "موظف",
        maxShiftsPerWeek: 5, // قيمة افتراضية
        preferredShifts: [],
      })

      // إنشاء جدول للموظف
      createNewSchedule({
        name: `جدول ${employeeName}`,
        startDate: employeeStartDate.toISOString(),
        months: employeeMonths,
        workDays: [
          { type: "work", count: employeeWorkDays, color: employeeWorkColor },
          { type: "off", count: employeeOffDays, color: employeeOffColor },
        ],
        notes: {},
        pins: {},
        monthColors: {},
        backgroundColor: "#ffffff",
        employeeName: employeeName,
        comments: [],
        showComments: true,
        assignments: {},
      })

      // إعادة تعيين القيم
      setEmployeeName("")
      setEmployeePosition("")
      setEmployeeWorkDays(1)
      setEmployeeOffDays(3)
      setEmployeeWorkColor("#4CAF50")
      setEmployeeOffColor("#FFFFFF")
      setEmployeeMonths(3)
      setEmployeeStartDate(new Date())
      setEmployeeSetupStep(1) // إعادة تعيين الخطوة إلى الخطوة الأولى
      setShowEmployeeForm(false)

      // إظهار رسالة نجاح
      alert(`تم إضافة الموظف ${employeeName} وإنشاء جدول له بنجاح`)
    }
  }

  // دالة إعادة تهيئة التطبيق
  const handleResetApplication = () => {
    if (window.confirm("هل أنت متأكد من إعادة تهيئة التطبيق؟ سيتم حذف جميع البيانات.")) {
      resetStore()
      localStorage.removeItem("schedule-visited")
      localStorage.removeItem("schedule-start-date")
      localStorage.removeItem("schedule-months")
      localStorage.removeItem("schedule-view-mode")
      window.location.reload()
    }
  }

  // دالة حذف جدول موظف وإعادة فتح نافذة إنشاء جدول جديد
  const handleDeleteScheduleAndCreateNew = (scheduleId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الجدول؟")) {
      deleteScheduleFromHistory(scheduleId)
      setSetupStep(1) // إعادة تعيين الخطوة إلى الخطوة الأولى
      setShowSetupWizard(true) // فتح نافذة إنشاء جدول جديد
    }
  }

  // Actualizar valores de configuración cuando cambia el horario actual
  useEffect(() => {
    if (currentSchedule) {
      // Actualizar los valores de configuración basados en el horario actual
      try {
        const startDateObj = new Date(currentSchedule.startDate)
        if (!isNaN(startDateObj.getTime())) {
          setStartDate(startDateObj)
        }

        if (currentSchedule.months) {
          setMonths(currentSchedule.months)
        }

        if (currentSchedule.workDays && currentSchedule.workDays.length >= 2) {
          const workDayConfig = currentSchedule.workDays.find((day) => day.type === "work")
          const offDayConfig = currentSchedule.workDays.find((day) => day.type === "off")

          if (workDayConfig) {
            setWorkDays(workDayConfig.count)
            setWorkColor(workDayConfig.color)
          }

          if (offDayConfig) {
            setOffDays(offDayConfig.count)
            setOffColor(offDayConfig.color)
          }
        }
      } catch (error) {
        console.error("Error updating settings from current schedule:", error)
      }
    }
  }, [currentSchedule])

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <main dir="rtl" className="min-h-screen bg-background p-4 md:p-8" id="schedule-container">
        {/* Setup Wizard */}
        {showSetupWizard && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-primary rounded-t-xl"></div>

              {setupStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-primary">مرحباً بك في تطبيق جدول العمل</h2>
                  <p className="text-gray-600 text-center">لنبدأ بإنشاء جدول العمل الخاص بك</p>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">ادخال اسم للجدول</label>
                    <Input
                      type="text"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                      placeholder="أدخل اسم للجدول"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setSetupStep(2)} className="flex items-center gap-2">
                      التالي
                    </Button>
                  </div>
                </div>
              )}

              {setupStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-primary">تحديد تاريخ البدء</h2>
                  <p className="text-gray-600 text-center">اختر أول يوم عمل في الجدول</p>

                  <div className="flex justify-center">
                    <Input
                      type="date"
                      value={startDate.toISOString().split("T")[0]}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setSetupStep(1)}>
                      السابق
                    </Button>
                    <Button onClick={() => setSetupStep(3)} className="flex items-center gap-2">
                      التالي
                    </Button>
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-primary">تحديد أيام العمل والإجازات</h2>
                  <p className="text-gray-600 text-center">حدد عدد أيام العمل والإجازات</p>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">أيام العمل</label>
                      <div className="flex gap-4">
                        <Input
                          type="number"
                          value={workDays}
                          onChange={(e) => setWorkDays(Number(e.target.value))}
                          min="1"
                          max="30"
                          className="w-20 p-2 border rounded-md"
                        />
                        <div className="relative flex-1">
                          <Input
                            type="color"
                            value={workColor}
                            onChange={(e) => setWorkColor(e.target.value)}
                            className="w-full h-10 p-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">أيام الإجازات</label>
                      <div className="flex gap-4">
                        <Input
                          type="number"
                          value={offDays}
                          onChange={(e) => setOffDays(Number(e.target.value))}
                          min="1"
                          max="30"
                          className="w-20 p-2 border rounded-md"
                        />
                        <div className="relative flex-1">
                          <Input
                            type="color"
                            value={offColor}
                            onChange={(e) => setOffColor(e.target.value)}
                            className="w-full h-10 p-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأشهر المعروضة</label>
                      <select
                        value={months}
                        onChange={(e) => setMonths(Number(e.target.value))}
                        className="w-full rounded-lg border p-2"
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num} شهر
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setSetupStep(2)}>
                      السابق
                    </Button>
                    <Button onClick={handleCreateFromWizard} className="bg-primary">
                      إنشاء الجدول
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t flex justify-center">
                <div className="flex gap-2">
                  <span className={`w-3 h-3 rounded-full ${setupStep === 1 ? "bg-primary" : "bg-gray-300"}`}></span>
                  <span className={`w-3 h-3 rounded-full ${setupStep === 2 ? "bg-primary" : "bg-gray-300"}`}></span>
                  <span className={`w-3 h-3 rounded-full ${setupStep === 3 ? "bg-primary" : "bg-gray-300"}`}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel - Enhanced Version */}
        {showSettingsPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col md:flex-row">
              {/* Sidebar */}
              <div className="w-full md:w-64 bg-gray-50 border-l md:border-l-0 md:border-r">
                <div className="p-4 bg-primary text-white">
                  <h2 className="text-xl font-bold">الإعدادات</h2>
                </div>
                <ul className="py-2">
                  <li>
                    <button
                      onClick={() => setActiveSettingsTab("general")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        activeSettingsTab === "general"
                          ? "bg-primary/10 text-primary border-r-4 border-primary"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      <span>الإعدادات العامة</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveSettingsTab("schedules")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        activeSettingsTab === "schedules"
                          ? "bg-primary/10 text-primary border-r-4 border-primary"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Calendar className="h-5 w-5" />
                      <span>الجداول المحفوظة</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveSettingsTab("employees")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        activeSettingsTab === "employees"
                          ? "bg-primary/10 text-primary border-r-4 border-primary"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span>الموظفين</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveSettingsTab("system")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        activeSettingsTab === "system"
                          ? "bg-primary/10 text-primary border-r-4 border-primary"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>النظام</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveSettingsTab("about")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        activeSettingsTab === "about"
                          ? "bg-primary/10 text-primary border-r-4 border-primary"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Info className="h-5 w-5" />
                      <span>عن الموقع</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-medium">
                    {activeSettingsTab === "general" && "الإعدادات العامة"}
                    {activeSettingsTab === "schedules" && "الجداول المحفوظة"}
                    {activeSettingsTab === "employees" && "الموظفين"}
                    {activeSettingsTab === "system" && "إعدادات النظام"}
                    {activeSettingsTab === "about" && "عن الموقع"}
                  </h3>
                  <button onClick={() => setShowSettingsPanel(false)} className="p-2 rounded-full hover:bg-gray-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* General Settings */}
                  {activeSettingsTab === "general" && (
                    <div className="space-y-6">
                      {/* تاريخ البدء */}
                      <div className="space-y-3">
                        <h3 className="font-medium">تاريخ البدء</h3>
                        <Input
                          type="date"
                          value={startDate.toISOString().split("T")[0]}
                          onChange={(e) => setStartDate(new Date(e.target.value))}
                        />

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => setStartDate(new Date())}>
                            اليوم
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const tomorrow = new Date()
                              tomorrow.setDate(tomorrow.getDate() + 1)
                              setStartDate(tomorrow)
                            }}
                          >
                            غداً
                          </Button>
                        </div>
                      </div>

                      {/* عدد الأشهر */}
                      <div className="space-y-3">
                        <h3 className="font-medium">عدد الأشهر</h3>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm" onClick={() => setMonths(Math.max(1, months - 1))}>
                            -
                          </Button>
                          <div className="flex-1 bg-gray-100 rounded-md p-2 text-center">{months} شهر</div>
                          <Button variant="outline" size="sm" onClick={() => setMonths(Math.min(36, months + 1))}>
                            +
                          </Button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {[3, 6, 12, 24].map((value) => (
                            <Button
                              key={value}
                              variant={months === value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setMonths(value)}
                            >
                              {value} شهر
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* أيام العمل والإجازات */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-100">
                          <h3 className="font-medium text-green-800">أيام العمل</h3>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={workDays}
                              onChange={(e) => setWorkDays(Number(e.target.value))}
                              min="1"
                              max="30"
                              className="w-20"
                            />
                            <Input
                              type="color"
                              value={workColor}
                              onChange={(e) => setWorkColor(e.target.value)}
                              className="w-20 h-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                          <h3 className="font-medium text-red-800">أيام الإجازات</h3>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={offDays}
                              onChange={(e) => setOffDays(Number(e.target.value))}
                              min="1"
                              max="30"
                              className="w-20"
                            />
                            <Input
                              type="color"
                              value={offColor}
                              onChange={(e) => setOffColor(e.target.value)}
                              className="w-20 h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* طريقة العرض */}
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-blue-800">طريقة العرض</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={scheduleViewMode === "cards" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setScheduleViewMode("cards")}
                          >
                            بطاقات
                          </Button>
                          <Button
                            variant={scheduleViewMode === "arrows" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setScheduleViewMode("arrows")}
                          >
                            بالأسهم
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedules */}
                  {activeSettingsTab === "schedules" && (
                    <div className="space-y-4">
                      {savedSchedules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">لا توجد جداول محفوظة</div>
                      ) : (
                        <div className="space-y-3">
                          {savedSchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary transition-colors"
                            >
                              <div>
                                <h3 className="font-medium">{schedule.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {formatDate(new Date(schedule.createdAt || ""))}
                                </p>
                                {schedule.employeeName && (
                                  <p className="text-xs text-primary mt-1">الموظف: {schedule.employeeName}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    loadScheduleFromHistory(schedule.id)
                                    setShowSettingsPanel(false)
                                    alert(`تم تحميل جدول ${schedule.name}`)
                                  }}
                                >
                                  تحميل
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف جدول ${schedule.name}؟`)) {
                                      deleteScheduleFromHistory(schedule.id)
                                      // إذ  {
                                      deleteScheduleFromHistory(schedule.id)
                                      // إذا كان هذا آخر جدول، افتح نافذة إنشاء جدول جديد
                                      if (savedSchedules.length === 1) {
                                        setSetupStep(1)
                                        setShowSettingsPanel(false)
                                        setShowSetupWizard(true)
                                      }
                                      alert(`تم حذف جدول ${schedule.name}`)
                                    }
                                  }}
                                >
                                  حذف
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Employees */}
                  {activeSettingsTab === "employees" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">إدارة الموظفين</h3>
                        <Button
                          onClick={() => {
                            setShowEmployeeForm(true)
                            setEmployeeSetupStep(1) // إعادة تعيين الخطوة إلى الخطوة الأولى
                            setShowSettingsPanel(false)
                          }}
                          className="bg-primary"
                          size="sm"
                        >
                          إضافة موظف جديد
                        </Button>
                      </div>

                      {employees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          لا يوجد موظفين. أضف موظف جديد.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {employees.map((employee) => (
                            <div
                              key={employee.id}
                              className="p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{employee.name}</div>
                                  <div className="text-sm text-gray-500">{employee.position}</div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const employeeSchedule = savedSchedules.find(
                                        (s) => s.employeeName === employee.name,
                                      )
                                      if (employeeSchedule) {
                                        loadScheduleFromHistory(employeeSchedule.id)
                                        setShowSettingsPanel(false)
                                        alert(`تم تحميل جدول الموظف ${employee.name}`)
                                      } else {
                                        alert(`لا يوجد جدول للموظف ${employee.name}`)
                                      }
                                    }}
                                  >
                                    <Calendar className="h-4 w-4 ml-1" />
                                    تحميل الجدول
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (window.confirm(`هل أنت متأكد من حذف الموظف ${employee.name}؟`)) {
                                        // البحث عن جدول الموظف وحذفه
                                        const employeeSchedule = savedSchedules.find(
                                          (s) => s.employeeName === employee.name,
                                        )
                                        if (employeeSchedule) {
                                          deleteScheduleFromHistory(employeeSchedule.id)
                                        }

                                        deleteEmployee(employee.id)
                                        alert(`تم حذف الموظف ${employee.name} بنجاح`)

                                        // إذا كان هذا آخر موظف، افتح نافذة إنشاء جدول جديد
                                        if (employees.length === 1) {
                                          setSetupStep(1)
                                          setShowSettingsPanel(false)
                                          setShowSetupWizard(true)
                                        }
                                      }
                                    }}
                                  >
                                    حذف
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* System */}
                  {activeSettingsTab === "system" && (
                    <div className="space-y-6">
                      <div className="bg-red-50 rounded-lg p-6 shadow-sm border border-red-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-red-100 p-2 rounded-full">
                            <RefreshCw className="h-5 w-5 text-red-600" />
                          </div>
                          <h3 className="font-semibold text-lg text-red-700">إعادة تهيئة التطبيق</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                          سيؤدي هذا الإجراء إلى حذف جميع البيانات وإعادة تشغيل التطبيق كما لو كنت تستخدمه لأول مرة.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleResetApplication}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          إعادة تهيئة التطبيق
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === "about" && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Info className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-lg text-blue-700">عن الموقع</h3>
                        </div>
                        <div className="space-y-4 text-gray-700">
                          <p className="leading-relaxed">
                            السلام عليكم ورحمه الله وبركاته. هذا الموقع تجريبي وقد تواجه بعض الاخطاء وتم تصميمه عبر
                            الذكاء الاصطناعي.
                          </p>
                          <p>شكرا لاستخدامك الموقع.</p>
                          <div className="pt-4 border-t border-blue-200">
                            <p className="font-medium">تحياتي،</p>
                            <p>عمر الوهيبي</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm font-medium">واتساب:</span>
                              <a
                                href="https://wa.me/96892670679"
                                className="text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                +96892670679
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowSettingsPanel(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleSaveSettings}>حفظ الإعدادات</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Form */}
        {showEmployeeForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-purple-600 rounded-t-xl"></div>
              <button
                onClick={() => setShowEmployeeForm(false)}
                className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>

              {employeeSetupStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-purple-600">إضافة موظف جديد</h2>
                  <p className="text-gray-600 text-center">أدخل بيانات الموظف الأساسية</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">اسم الموظف</label>
                      <Input
                        type="text"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        placeholder="أدخل اسم الموظف"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">المسمى الوظيفي</label>
                      <Input
                        type="text"
                        value={employeePosition}
                        onChange={(e) => setEmployeePosition(e.target.value)}
                        placeholder="أدخل المسمى الوظيفي"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => setEmployeeSetupStep(2)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      التالي
                      <ChevronRight className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                </div>
              )}

              {employeeSetupStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-purple-600">تحديد تاريخ البدء</h2>
                  <p className="text-gray-600 text-center">اختر أول يوم عمل للموظف</p>

                  <div className="flex justify-center">
                    <Input
                      type="date"
                      value={employeeStartDate.toISOString().split("T")[0]}
                      onChange={(e) => setEmployeeStartDate(new Date(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setEmployeeSetupStep(1)}>
                      السابق
                    </Button>
                    <Button
                      onClick={() => setEmployeeSetupStep(3)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      التالي
                      <ChevronRight className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                </div>
              )}

              {employeeSetupStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-purple-600">تحديد أيام العمل والإجازات</h2>
                  <p className="text-gray-600 text-center">حدد عدد أيام العمل والإجازات للموظف</p>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">أيام العمل</label>
                      <div className="flex gap-4">
                        <Input
                          type="number"
                          value={employeeWorkDays}
                          onChange={(e) => setEmployeeWorkDays(Number(e.target.value))}
                          min="1"
                          max="30"
                          className="w-20 p-2 border rounded-md"
                        />
                        <div className="relative flex-1">
                          <Input
                            type="color"
                            value={employeeWorkColor}
                            onChange={(e) => setEmployeeWorkColor(e.target.value)}
                            className="w-full h-10 p-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">أيام الإجازات</label>
                      <div className="flex gap-4">
                        <Input
                          type="number"
                          value={employeeOffDays}
                          onChange={(e) => setEmployeeOffDays(Number(e.target.value))}
                          min="1"
                          max="30"
                          className="w-20 p-2 border rounded-md"
                        />
                        <div className="relative flex-1">
                          <Input
                            type="color"
                            value={employeeOffColor}
                            onChange={(e) => setEmployeeOffColor(e.target.value)}
                            className="w-full h-10 p-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأشهر المعروضة</label>
                      <select
                        value={employeeMonths}
                        onChange={(e) => setEmployeeMonths(Number(e.target.value))}
                        className="w-full rounded-lg border p-2"
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num} شهر
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setEmployeeSetupStep(2)}>
                      السابق
                    </Button>
                    <Button onClick={handleAddEmployee} className="bg-purple-600 hover:bg-purple-700 text-white">
                      حفظ وإنشاء الجدول
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t flex justify-center">
                <div className="flex gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${employeeSetupStep === 1 ? "bg-purple-600" : "bg-gray-300"}`}
                  ></span>
                  <span
                    className={`w-3 h-3 rounded-full ${employeeSetupStep === 2 ? "bg-purple-600" : "bg-gray-300"}`}
                  ></span>
                  <span
                    className={`w-3 h-3 rounded-full ${employeeSetupStep === 3 ? "bg-purple-600" : "bg-gray-300"}`}
                  ></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto">
          <header className="bg-white border-b sticky top-0 z-10 shadow-sm mb-6 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">جدول العمل</h1>
              </div>
              <div className="flex-1 flex items-center justify-center mx-8">
                {currentSchedule && <h2 className="text-xl font-semibold text-primary">{currentSchedule.name}</h2>}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettingsPanel(true)}
                  className="bg-white hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 ml-2" />
                  <span className="hidden sm:inline">الإعدادات</span>
                  <span className="sm:hidden">إعدادات</span>
                </Button>
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-semibold">{formatDate(new Date())}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {!showSetupWizard && (
            <div className="container mx-auto">
              {savedSchedules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <h3 className="text-xl font-medium text-gray-600 mb-4">لا توجد جداول محفوظة</h3>
                  <p className="text-gray-500 mb-6">قم بإنشاء جدول جديد للبدء</p>
                  <Button
                    onClick={() => {
                      setSetupStep(1)
                      setShowSetupWizard(true)
                    }}
                    className="bg-primary"
                  >
                    <Calendar className="h-4 w-4 ml-2" />
                    إنشاء جدول جديد
                  </Button>
                </div>
              ) : (
                <>
                  <ScheduleViewSelector onViewChange={handleViewModeChange} currentView={scheduleViewMode} />
                  <ScheduleGrid
                    startDate={startDate}
                    months={months}
                    workDays={workDays}
                    offDays={offDays}
                    workColor={workColor}
                    offColor={offColor}
                    viewMode={scheduleViewMode}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </ThemeProvider>
  )
}

