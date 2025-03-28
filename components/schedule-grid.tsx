"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns"
import { ar } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Pin, PinOff, MessageSquare, X, CheckCircle, Bell } from "lucide-react"
import { useScheduleStore } from "@/lib/store/schedule-store"
import { useShiftStore } from "@/lib/store/shift-store"
import { cn } from "@/lib/utils"
import type { WorkDay, Comment } from "@/lib/types"

interface ScheduleGridProps {
  startDate?: Date
  months?: number
  workDays?: number
  offDays?: number
  workColor?: string
  offColor?: string
  viewMode?: string
}

export function ScheduleGrid({
  startDate: propStartDate,
  months: propMonths = 12,
  workDays = 1,
  offDays = 3,
  workColor = "#2E7D32",
  offColor = "#FFFFFF",
  viewMode: propViewMode,
}: ScheduleGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([])
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState<{ date: Date; comments: Comment[] } | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  // تعديل دالة ScheduleGrid لدعم أنماط العرض المختلفة
  // أضف هذا المتغير الجديد إلى قائمة المتغيرات في بداية الدالة
  const [viewMode, setViewMode] = useState(propViewMode || "cards") // "cards", "arrows", "all"

  const { currentSchedule, updateSchedule, togglePinDay } = useScheduleStore()
  const { shifts } = useShiftStore()

  // استخدام وضع العرض من الخارج إذا تم تمريره
  useEffect(() => {
    if (propViewMode) {
      setViewMode(propViewMode)
    } else if (typeof window !== "undefined") {
      const storedViewMode = localStorage.getItem("schedule-view-mode")
      if (storedViewMode) {
        setViewMode(storedViewMode)
      }
    }
  }, [propViewMode])

  // Initialize visible months
  useEffect(() => {
    if (propMonths && propMonths > 0) {
      const startDateObj = propStartDate || new Date()
      const today = new Date()
      const allMonths = Array.from({ length: propMonths }, (_, i) => addMonths(new Date(startDateObj), i))

      // Find the index of the current month
      let currentIdx = 0
      allMonths.forEach((month, index) => {
        if (isSameMonth(month, today)) {
          currentIdx = index
        }
      })

      setCurrentMonthIndex(currentIdx)
      setVisibleMonths(allMonths)
    }
  }, [propStartDate, propMonths])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const getShiftForDay = (dateStr: string) => {
    if (!currentSchedule || !currentSchedule.assignments) return null
    return currentSchedule.assignments[dateStr] || null
  }

  const getShiftById = (shiftId: string) => {
    return shifts.find((shift) => shift.id === shiftId) || null
  }

  const isPinned = (dateStr: string) => {
    if (!currentSchedule || !currentSchedule.pins) return false
    return !!currentSchedule.pins[dateStr]
  }

  const handlePinToggle = (dateStr: string) => {
    if (currentSchedule) {
      togglePinDay(currentSchedule.id, dateStr)
    }
  }

  const getCommentForDay = (dateStr: string) => {
    if (!currentSchedule || !currentSchedule.comments) return null
    return currentSchedule.comments.find((comment) => comment.date === dateStr) || null
  }

  // Get work day type for a specific date - FIXED FUNCTION
  const getWorkDayForDate = (date: Date): WorkDay | null => {
    if (!currentSchedule?.workDays?.length) {
      // If no work days defined in schedule, use the props
      const totalDays = workDays + offDays
      if (totalDays === 0) return null

      const startDateObj = propStartDate || new Date()

      // Ensure we're working with the correct date format
      const startDateToUse = typeof startDateObj === "string" ? parseISO(startDateObj) : startDateObj

      // Reset hours, minutes, seconds and milliseconds for accurate day comparison
      const normalizedStartDate = new Date(startDateToUse)
      normalizedStartDate.setHours(0, 0, 0, 0)

      const normalizedDate = new Date(date)
      normalizedDate.setHours(0, 0, 0, 0)

      // Calculate days difference from start date
      // Use time difference and convert to days to avoid timezone issues
      const timeDiff = normalizedDate.getTime() - normalizedStartDate.getTime()
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

      // Calculate position in cycle (0-based)
      // Use modulo to handle negative daysDiff (dates before start date)
      const cyclePosition = ((daysDiff % totalDays) + totalDays) % totalDays

      if (cyclePosition < workDays) {
        return { type: "work", count: workDays, color: workColor }
      } else {
        return { type: "off", count: offDays, color: offColor }
      }
    }

    const totalDays = currentSchedule.workDays.reduce((sum, day) => sum + day.count, 0)
    if (totalDays === 0) return null

    // Ensure we're working with the correct date format for the schedule's start date
    const startDateObj =
      typeof currentSchedule.startDate === "string"
        ? parseISO(currentSchedule.startDate)
        : new Date(currentSchedule.startDate)

    // Reset hours, minutes, seconds and milliseconds for accurate day comparison
    const normalizedStartDate = new Date(startDateObj)
    normalizedStartDate.setHours(0, 0, 0, 0)

    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Calculate days difference using time difference to avoid timezone issues
    const timeDiff = normalizedDate.getTime() - normalizedStartDate.getTime()
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    // Calculate position in cycle (0-based)
    // Use modulo to handle negative daysDiff (dates before start date)
    const cyclePosition = ((daysDiff % totalDays) + totalDays) % totalDays

    let currentPosition = 0

    for (const workDay of currentSchedule.workDays) {
      if (cyclePosition < currentPosition + workDay.count) {
        return workDay
      }
      currentPosition += workDay.count
    }

    return currentSchedule.workDays[0]
  }

  // Get comments for a specific date
  const getCommentsForDate = (date: Date): Comment[] => {
    if (!currentSchedule?.comments) return []

    const dateStr = format(date, "yyyy-MM-dd")
    return currentSchedule.comments.filter((comment) => {
      const commentDate = new Date(comment.date)
      return format(commentDate, "yyyy-MM-dd") === dateStr
    })
  }

  // Navigate to previous months
  const goToPreviousMonths = () => {
    if (currentMonthIndex > 0) {
      const newIndex = currentMonthIndex - 1
      setCurrentMonthIndex(newIndex)
    }
  }

  // Navigate to next months
  const goToNextMonths = () => {
    if (propMonths && currentMonthIndex < propMonths - 1) {
      const newIndex = currentMonthIndex + 1
      setCurrentMonthIndex(newIndex)
    }
  }

  const today = new Date()

  // تعديل الدالة لتدعم أنماط العرض المختلفة
  // تعديل في قسم العرض الرئيسي للجداول (حوالي السطر 300)
  // استبدل الشرط الحالي بهذا الشرط المحسن
  if (visibleMonths.length > 0) {
    return (
      <div className="space-y-8">
        {viewMode === "arrows" && (
          <div className="flex justify-between items-center">
            <Button variant="outline" size="icon" onClick={goToPreviousMonths} disabled={currentMonthIndex === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h2 className="text-xl font-bold">
                {visibleMonths.length > 0 && format(visibleMonths[currentMonthIndex], "MMMM yyyy", { locale: ar })}
              </h2>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonths}
              disabled={propMonths ? currentMonthIndex >= propMonths - 1 : false}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div
          className={`grid grid-cols-1 ${
            viewMode === "cards"
              ? "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          } gap-6`}
        >
          {(viewMode === "cards"
            ? visibleMonths // عرض جميع البطاقات في وضع "cards"
            : visibleMonths.slice(currentMonthIndex, currentMonthIndex + 4)
          ).map((month) => {
            const monthKey = format(month, "yyyy-MM")
            const monthNumber = Number.parseInt(format(month, "M"))
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
            const isCurrentMonth = isSameMonth(month, today)
            const firstDayOfMonth = monthStart.getDay()

            return (
              <div
                key={monthKey}
                className={cn(
                  "rounded-xl border shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1",
                  isCurrentMonth && "ring-2 ring-red-500", // تغيير من ring-primary إلى ring-red-500
                )}
                style={{
                  backgroundColor: currentSchedule?.monthColors?.[monthKey] || "#ffffff",
                }}
              >
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className={cn("text-lg font-bold", isCurrentMonth && "text-red-500")}>
                        {" "}
                        {/* تغيير من text-primary إلى text-red-500 */}
                        {format(month, "MMMM yyyy", { locale: ar })}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-800">{monthNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day, index) => (
                      <div
                        key={day}
                        className={cn(
                          "text-center font-bold py-1 px-0.5 rounded-md bg-gray-50/80 border",
                          "flex items-center justify-center min-h-[2rem] text-[10px] sm:text-xs",
                          index === 5 || index === 6 ? "border-green-200 bg-green-50/50" : "border-gray-100",
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-[2px]">
                    {/* Empty cells for days before the start of the month */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div
                        key={`empty-start-${i}`}
                        className="aspect-square border border-gray-100 rounded-md min-h-[2.5rem] min-w-[2.5rem]"
                      />
                    ))}

                    {days.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd")
                      const dayKey = format(day, "dd")
                      const isPinned = currentSchedule?.pins?.[`${monthKey}-${dayKey}`] || false
                      const isToday = isSameDay(day, today)
                      const workDay = getWorkDayForDate(day)
                      const dayOfWeek = day.getDay()
                      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday or Saturday
                      const dayComments = getCommentsForDate(day)
                      const hasComments = dayComments.length > 0
                      const hasHighImportance = dayComments.some((comment) => comment.importance === "high")
                      const shiftId = getShiftForDay(dateStr)
                      const shift = shiftId ? getShiftById(shiftId) : null

                      return (
                        <button
                          key={dateStr}
                          onClick={() => handlePinToggle(dateStr)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            setSelectedDay({ date: day, comments: dayComments })
                            setShowCommentModal(true)
                          }}
                          className={cn(
                            "relative aspect-square flex flex-col items-center justify-center transition-all duration-200",
                            "border rounded-md",
                            "min-h-[2rem] min-w-[2rem] sm:min-h-[2.5rem] sm:min-w-[2.5rem]",
                            {
                              "bg-green-50 border-green-200": isWeekend && !workDay && !shift,
                              "bg-opacity-90 hover:bg-opacity-100": workDay || shift,
                              "text-white": (workDay?.type === "work" || shift) && !isWeekend,
                              "text-gray-900": workDay?.type === "off" && !shift,
                            },
                            isToday && "ring-2 ring-primary",
                            isPinned && "ring-1 ring-yellow-500",
                          )}
                          style={{
                            backgroundColor: shift
                              ? `${shift.color}40`
                              : workDay?.color || (isWeekend ? "#f0fdf4" : "#ffffff"),
                            color: shift ? "#000000" : workDay?.type === "work" ? "#ffffff" : "#000000",
                          }}
                        >
                          <span className={cn("font-medium text-xs sm:text-sm", isToday && "font-bold")}>
                            {format(day, "d")}
                          </span>

                          {shift && (
                            <div
                              className="mt-1 text-[8px] px-1 rounded w-full text-center"
                              style={{ backgroundColor: shift.color, color: "#fff" }}
                            >
                              {shift.name}
                            </div>
                          )}

                          {/* Comment indicators */}
                          {currentSchedule?.showComments && hasComments && (
                            <div className="absolute bottom-0.5 right-0.5 flex items-center">
                              <MessageSquare
                                className={cn("h-3 w-3", hasHighImportance ? "text-red-500" : "text-blue-500")}
                              />
                              {dayComments.length > 1 && (
                                <span className="text-[10px] font-bold">{dayComments.length}</span>
                              )}
                            </div>
                          )}

                          {isPinned && <Pin className="absolute top-0.5 right-0.5 h-3 w-3 text-yellow-500" />}
                        </button>
                      )
                    })}

                    {/* Empty cells to complete the last row */}
                    {(() => {
                      const lastDayOfMonth = monthEnd.getDate()
                      const lastDayOfWeek = new Date(month.getFullYear(), month.getMonth(), lastDayOfMonth).getDay()
                      const remainingCells = lastDayOfWeek === 6 ? 0 : 6 - lastDayOfWeek

                      return Array.from({ length: remainingCells }).map((_, i) => (
                        <div
                          key={`empty-end-${i}`}
                          className="aspect-square border border-gray-100 rounded-md min-h-[2.5rem] min-w-[2.5rem]"
                        />
                      ))
                    })()}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal for showing day comments */}
        {showCommentModal && selectedDay && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowCommentModal(false)}
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => setShowCommentModal(false)}>
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold">
                  تعليقات يوم {format(selectedDay.date, "d MMMM yyyy", { locale: ar })}
                </h2>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedDay.comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">لا توجد تعليقات لهذا اليوم</div>
                ) : (
                  selectedDay.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-lg border"
                      style={{ borderRightWidth: "4px", borderRightColor: comment.color }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {comment.isCompleted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              تم الإكمال
                            </span>
                          )}
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${
                              comment.importance === "high"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : comment.importance === "medium"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {comment.importance === "high"
                              ? "عالية"
                              : comment.importance === "medium"
                                ? "متوسطة"
                                : "منخفضة"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right mb-3">
                        <p className="text-gray-800 whitespace-pre-line">{comment.text}</p>
                      </div>

                      {comment.reminder && (
                        <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                          <span>{format(new Date(comment.reminder), "yyyy/MM/dd", { locale: ar })}</span>
                          <Bell className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default single month view (fallback)
  return (
    <Card className="mb-6 schedule-grid-container">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">{format(currentDate, "MMMM yyyy", { locale: ar })}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day) => (
            <div key={day} className="text-center font-medium p-2">
              {day}
            </div>
          ))}

          {Array(monthStart.getDay())
            .fill(null)
            .map((_, index) => (
              <div key={`empty-${index}`} className="p-2"></div>
            ))}

          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const shiftId = getShiftForDay(dateStr)
            const shift = shiftId ? getShiftById(shiftId) : null
            const hasComment = getCommentForDay(dateStr) !== null
            const pinned = isPinned(dateStr)
            const dayType = getWorkDayForDate(day)

            return (
              <div
                key={dateStr}
                className={cn(
                  "p-2 min-h-[80px] border rounded-md relative",
                  isToday(day) && "border-primary",
                  isWeekend(day) && "bg-muted/50",
                )}
                style={{
                  backgroundColor: shift
                    ? `${shift.color}20`
                    : dayType?.type === "work"
                      ? `${dayType.color}20`
                      : dayType?.color,
                }}
              >
                <div className="flex justify-between items-start">
                  <span className={cn("font-medium", isToday(day) && "text-primary")}>{format(day, "d")}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePinToggle(dateStr)}>
                    {pinned ? (
                      <Pin className="h-3 w-3 text-primary" />
                    ) : (
                      <PinOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {shift && (
                  <div className="mt-1 text-xs p-1 rounded" style={{ backgroundColor: shift.color, color: "#fff" }}>
                    {shift.name}
                  </div>
                )}

                {!shift && dayType?.type === "work" && (
                  <div className="mt-1 text-xs p-1 rounded" style={{ backgroundColor: dayType.color, color: "#fff" }}>
                    يوم عمل
                  </div>
                )}

                {hasComment && <div className="absolute bottom-1 right-1 w-2 h-2 bg-primary rounded-full"></div>}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

