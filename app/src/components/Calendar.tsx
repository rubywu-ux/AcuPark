"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface CalendarProps {
  selectedDates: string[];
  onDateSelect: (date: string) => void;
  minDate?: string;
}

export default function Calendar({ selectedDates, onDateSelect, minDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return dateStr < minDate;
  };

  const isDateSelected = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return selectedDates.includes(dateStr);
  };

  const handleDayClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    onDateSelect(dateStr);
  };

  const renderDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day);
      const selected = isDateSelected(day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          disabled={disabled}
          className={clsx(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
            selected 
              ? "bg-primary text-white shadow-md" 
              : disabled 
                ? "text-gray-300 cursor-not-allowed" 
                : "text-gray-700 hover:bg-gray-100"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h3 className="font-semibold text-gray-800">
          {monthName} {year}
        </h3>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="h-10 w-10 flex items-center justify-center text-xs font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}
