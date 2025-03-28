"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useScheduleStore } from "@/lib/store/schedule-store"
import { useEmployeeStore } from "@/lib/store/employee-store"
import { X, Save, Calendar, Users, Settings, MessageSquare, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { format, addDays } from "date-fns"

interface SettingsPanelProps {
  onClose: () => void
  startDate: Date
  setStartDate: (date: Date) => void
  months: number
  setMonths: (months: number) => void
  workDays: number
  setWorkDays: (days: number) => void
  workColor: string
  setWorkColor: (color: string) => void
  offDays: number
  setOffDays: (days: number) => void
  offColor: string
  setOffColor: (color: string) => void
}

export function SettingsPanel({
  onClose,
  startDate,
  setStartDate,
  months,
  setMonths,
  workDays,
  setWorkDays,
  workColor,
  setWorkColor,
  offDays,
  setOffDays,
  offColor,
  setOffColor,
}: SettingsPanelProps) {
  const {
    currentSchedule,
    updateSchedule,
    savedSchedules,
    loadScheduleFromHistory,
    deleteScheduleFromHistory,
    resetStore,
  } = useScheduleStore()

  const { employees } = useEmployeeStore()

  const [activeSection, setActiveSection] = useState<string>("general")
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)

  // مجموعة من الألوان المقترحة
  const suggestedColors = [
    "#4CAF50", // أخضر
    "#2196F3", // أزرق
    "#F44336", // أحمر
    "#FFC107", // أصفر
    "#9C27B0", // بنفسجي
    "#FF9800", // برتقالي
    "#795548", // بني
    "#607D8B", // رمادي أزرق
    "#E91E63", // وردي
    "#00BCD4", // سماوي
  ]

  const handleColorChange = (colorType: string, color: string) => {
    if (colorType === "work") {
      setWorkColor(color)
    } else if (colorType === "off") {
      setOffColor(color)
    }
    setColorPickerOpen(null)
  }

  const resetApplication = () => {
    if (window.confirm("هل أنت متأكد من إعادة تهيئة التطبيق؟ سيتم حذف جميع البيانات.")) {
      resetStore()
      localStorage.removeItem("schedule-visited")
      localStorage.removeItem("schedule-start-date")
      localStorage.removeItem("schedule-months")
      window.location.reload()
    }
  }

  const applySettings = () => {
    if (currentSchedule) {
      updateSchedule(currentSchedule.id, {
        ...currentSchedule,
        startDate: startDate.toISOString(),
        months,
        workDays: [
          { type: "work", count: workDays, color: workColor },
          { type: "off", count: offDays, color: offColor },
        ],
      })
    }

    // Save settings to localStorage
    localStorage.setItem("schedule-start-date", startDate.toISOString())
    localStorage.setItem("schedule-months", months.toString())

    onClose()
  }

  const menuItems = [
    { id: "general", label: "الإعدادات العامة", icon: <Settings className="h-5 w-5" /> },
    { id: "schedules", label: "الجداول المحفوظة", icon: <Calendar className="h-5 w-5" /> },
    { id: "employees", label: "الموظفين", icon: <Users className="h-5 w-5" /> },
    { id: "comments", label: "التعليقات", icon: <MessageSquare className="h-5 w-5" /> },
    { id: "system", label: "النظام", icon: <RefreshCw className="h-5 w-5" /> },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">إعدادات الجدول</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-l overflow-y-auto">
            <ul className="py-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                      activeSection === item.id
                        ? "bg-primary/10 text-primary border-r-4 border-primary"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className={activeSection === item.id ? "text-primary" : "text-gray-500"}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "general" && (
              <div className="space-y-8">
                <h3 className="text-lg font-bold border-b pb-2">الإعدادات العامة</h3>

                {/* تاريخ البدء */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">تاريخ البدء</h4>
                    <div className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                      {format(startDate, "yyyy/MM/dd")}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Input
                      type="date"
                      value={format(startDate, "yyyy-MM-dd")}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                      className="w-full"
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setStartDate(new Date())}>
                        اليوم
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setStartDate(addDays(new Date(), 1))}>
                        غداً
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setStartDate(addDays(new Date(), 7))}>
                        بعد أسبوع
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setStartDate(addDays(new Date(), 30))}>
                        بعد شهر
                      </Button>
                    </div>
                  </div>
                </div>

                {/* عدد الأشهر */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">عدد الأشهر</h4>
                    <div className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">{months} شهر</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => setMonths(Math.max(1, months - 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 bg-gray-100 rounded-md p-2 text-center font-medium">{months}</div>
                      <Button variant="outline" size="icon" onClick={() => setMonths(Math.min(36, months + 1))}>
                        <ChevronLeft className="h-4 w-4" />
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
                </div>

                {/* أيام العمل والإجازات */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* أيام العمل */}
                  <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-100">
                    <h4 className="font-medium text-green-700">أيام العمل</h4>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => setWorkDays(Math.max(1, workDays - 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 bg-white rounded-md p-2 text-center font-medium">{workDays}</div>
                      <Button variant="outline" size="icon" onClick={() => setWorkDays(workDays + 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">لون أيام العمل:</span>
                        <button
                          onClick={() => setColorPickerOpen(colorPickerOpen === "work" ? null : "work")}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          style={{ backgroundColor: workColor }}
                        />
                      </div>

                      {colorPickerOpen === "work" && (
                        <div className="absolute z-10 mt-2 p-3 bg-white border rounded-md shadow-lg left-0 right-0">
                          <div className="grid grid-cols-5 gap-2">
                            {suggestedColors.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border hover:scale-110 transition-transform ${
                                  workColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange("work", color)}
                              />
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <Input
                              type="color"
                              value={workColor}
                              onChange={(e) => handleColorChange("work", e.target.value)}
                              className="w-full h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* أيام الإجازات */}
                  <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                    <h4 className="font-medium text-red-700">أيام الإجازات</h4>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => setOffDays(Math.max(1, offDays - 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 bg-white rounded-md p-2 text-center font-medium">{offDays}</div>
                      <Button variant="outline" size="icon" onClick={() => setOffDays(offDays + 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-700">لون أيام الإجازات:</span>
                        <button
                          onClick={() => setColorPickerOpen(colorPickerOpen === "off" ? null : "off")}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          style={{ backgroundColor: offColor }}
                        />
                      </div>

                      {colorPickerOpen === "off" && (
                        <div className="absolute z-10 mt-2 p-3 bg-white border rounded-md shadow-lg left-0 right-0">
                          <div className="grid grid-cols-5 gap-2">
                            {suggestedColors.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border hover:scale-110 transition-transform ${
                                  offColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange("off", color)}
                              />
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <Input
                              type="color"
                              value={offColor}
                              onChange={(e) => handleColorChange("off", e.target.value)}
                              className="w-full h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "schedules" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">الجداول المحفوظة</h3>

                {savedSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {savedSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary transition-colors"
                      >
                        <div>
                          <h3 className="font-medium">{schedule.name}</h3>
                          <p className="text-sm text-gray-500">{formatDate(new Date(schedule.createdAt || ""))}</p>
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
                              onClose()
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
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">لا توجد جداول محفوظة</div>
                )}
              </div>
            )}

            {activeSection === "employees" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">إدارة الموظفين</h3>

                {employees.length > 0 ? (
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
                                const employeeSchedule = savedSchedules.find((s) => s.employeeName === employee.name)
                                if (employeeSchedule) {
                                  loadScheduleFromHistory(employeeSchedule.id)
                                  onClose()
                                  alert(`تم تحميل جدول الموظف ${employee.name}`)
                                } else {
                                  alert(`لا يوجد جدول للموظف ${employee.name}`)
                                }
                              }}
                            >
                              <Calendar className="h-4 w-4 ml-1" />
                              تحميل الجدول
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    لا يوجد موظفين. أضف موظف جديد.
                  </div>
                )}
              </div>
            )}

            {activeSection === "comments" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">التعليقات والملاحظات</h3>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 shadow-sm border border-purple-100">
                  <p className="text-gray-600 mb-4">
                    يمكنك إضافة تعليقات وملاحظات على أيام محددة في الجدول. انقر بزر الماوس الأيمن على اليوم لإضافة
                    تعليق.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="font-medium mb-2">أهمية التعليقات</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>منخفضة - للملاحظات العادية</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>متوسطة - للتذكيرات المهمة</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>عالية - للأمور العاجلة والضرورية</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "system" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">إعدادات النظام</h3>

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
                    onClick={resetApplication}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    إعادة تهيئة التطبيق
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-end">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button onClick={applySettings} className="bg-primary">
              <Save className="h-4 w-4 ml-2" />
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

