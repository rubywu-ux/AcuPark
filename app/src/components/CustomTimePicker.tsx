"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { clsx } from 'clsx';

interface CustomTimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (value: string) => void;
  duration?: number; // Duration in hours
}

export default function CustomTimePicker({ value, onChange, duration = 2 }: CustomTimePickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSlotWidthRef = useRef(0);
  const isResizingRef = useRef(false);
  
  // Determine current meridiem from value
  const [h, m] = value ? value.split(':').map(Number) : [0, 0];
  const currentMeridiem = h >= 12 ? 'PM' : 'AM';

  // Dynamic slot width based on duration to ensure visibility
  // If duration is long (>= 2h), condense the timeline
  const isCondensed = duration >= 2;
  // < 2h: 40px (Standard)
  // 2h - <3h: 28px (Medium Zoom - "Zoomed less")
  // 3h - <4h: 18px (High Zoom)
  // >= 4h: 14px (Max Zoom)
  const slotWidth = duration >= 4 ? 14 : (duration >= 3 ? 18 : (duration >= 2 ? 28 : 40)); 

  // Detect width change synchronously during render to block scroll events immediately
  if (prevSlotWidthRef.current !== slotWidth && prevSlotWidthRef.current !== 0) {
    isResizingRef.current = true;
  }

  // Generate time slots based on current meridiem (12 hours only)
  const timeSlots = [];
  const startHour = currentMeridiem === 'AM' ? 0 : 12;
  
  for (let i = 0; i < 12; i++) {
    const hour = startHour + i;
    for (let min = 0; min < 60; min += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      timeSlots.push({
        value: timeString,
        hour: hour,
        minute: min,
        displayHour: hour % 12 || 12
      });
    }
  }

  // Handle AM/PM Toggle
  const toggleMeridiem = (newMeridiem: 'AM' | 'PM') => {
    if (newMeridiem === currentMeridiem) return;

    let newHour = h;
    if (newMeridiem === 'PM') {
      newHour = h + 12;
    } else {
      newHour = h - 12;
    }
    
    // Ensure valid 24h range
    if (newHour < 0) newHour = 0;
    if (newHour > 23) newHour = 23;

    const timeString = `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  // Scroll to selected time on mount/update
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      const isWidthChange = prevSlotWidthRef.current !== slotWidth;
      const container = scrollContainerRef.current;

      if (isWidthChange) {
        isResizingRef.current = true;
        // Temporarily disable snap to prevent fighting the programmatic scroll
        container.style.scrollSnapType = 'none';
        
        // Reset flag and snap after scroll settles
        setTimeout(() => {
          isResizingRef.current = false;
          if (container) {
            container.style.scrollSnapType = 'x mandatory';
          }
        }, 500);
      }

      // Only scroll if not currently scrolling by user, OR if width changed (force snap)
      if (!isScrollingRef.current || isWidthChange) {
        const selectedIndex = timeSlots.findIndex(slot => slot.value === value);
        if (selectedIndex !== -1) {
          // Calculate position to center the selected item
          const scrollPos = selectedIndex * slotWidth;
          
          // Immediate scroll update to prevent visual drift
          container.scrollTo({ left: scrollPos, behavior: isWidthChange ? 'auto' : 'smooth' });

          // Double-check scroll position after a frame to ensure layout stability during resize
          if (isWidthChange) {
            requestAnimationFrame(() => {
              if (container) {
                container.scrollTo({ left: scrollPos, behavior: 'auto' });
              }
            });
          }
        }
      }
      prevSlotWidthRef.current = slotWidth;
    }
  }, [value, currentMeridiem, slotWidth]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    isScrollingRef.current = true;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      // Ignore scroll updates triggered by resizing/zooming
      if (isResizingRef.current) {
        isScrollingRef.current = false;
        return;
      }
      
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      
      // Calculate closest index
      const index = Math.round(scrollLeft / slotWidth);
      
      // Ensure index is within bounds
      const safeIndex = Math.max(0, Math.min(index, timeSlots.length - 1));
      
      const selectedSlot = timeSlots[safeIndex];
      if (selectedSlot && selectedSlot.value !== value) {
        onChange(selectedSlot.value);
      }
      
      isScrollingRef.current = false;
    }, 150); // Wait 150ms after scroll stops
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-full">
      {/* Header & Toggle */}
      <div className="flex items-center justify-center mb-8 gap-4">
        {/* Digital Display Group */}
        <div className="flex flex-col items-end">
          <div className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            {(() => {
               if (!value) return "--:--";
               const hour12 = h % 12 || 12;
               return `${hour12}:${m.toString().padStart(2, '0')}`;
            })()}
          </div>
          {/* End Time Display */}
          {duration && (
            <div className="text-xs font-bold text-primary/80 mt-1">
              Ends {(() => {
                const endHour = (h + duration) % 24;
                const endMeridiem = endHour >= 12 ? 'PM' : 'AM';
                const endHour12 = endHour % 12 || 12;
                return `${endHour12}:${m.toString().padStart(2, '0')} ${endMeridiem}`;
              })()}
            </div>
          )}
        </div>

        {/* AM/PM Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg relative h-7 items-center">
          <button
            onClick={() => toggleMeridiem('AM')}
            className={clsx(
              "px-2 rounded-md text-xs font-bold transition-all duration-300 z-10 h-full flex items-center justify-center min-w-[28px]",
              currentMeridiem === 'AM' ? "text-white" : "text-gray-500 hover:text-gray-700"
            )}
          >
            AM
          </button>
          <button
            onClick={() => toggleMeridiem('PM')}
            className={clsx(
              "px-2 rounded-md text-xs font-bold transition-all duration-300 z-10 h-full flex items-center justify-center min-w-[28px]",
              currentMeridiem === 'PM' ? "text-white" : "text-gray-500 hover:text-gray-700"
            )}
          >
            PM
          </button>
          
          {/* Sliding Background */}
          <div 
            className={clsx(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-md transition-all duration-300 shadow-sm",
            )}
            style={{
                left: currentMeridiem === 'AM' ? '4px' : 'calc(50%)'
            }}
          />
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="relative h-28 w-full overflow-hidden">
        {/* Center Indicator - Removed static line to prevent double-line visual artifact */}
        {/* We rely on the selected tick mark (which is styled prominently) to indicate the current time */}
        
        {/* Duration Highlight Overlay */}
        {duration && (
          <div 
            className="absolute left-1/2 top-[35%] -translate-y-1/2 bg-primary/10 z-0 pointer-events-none rounded-r-md border-l border-primary/20 transition-all duration-300"
            style={{ 
              width: `${duration * 2 * slotWidth}px`, // Dynamic width based on slotWidth
              height: '40px', // Covers ticks only
            }}
          />
        )}

        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory h-full items-center no-scrollbar"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            paddingLeft: `calc(50% - ${slotWidth / 2}px)`, // Center the first item
            paddingRight: `calc(50% - ${slotWidth / 2}px)`
          }}
        >
          {timeSlots.map((slot) => {
            const isSelected = slot.value === value;
            const isFullHour = slot.minute === 0;
            const isEvenHour = slot.hour % 2 === 0 && isFullHour;
            
            // Calculate visibility
            let isLabelVisible = false;
            
            if (isSelected) {
              isLabelVisible = true;
            } else {
              // Calculate distance from selected slot in minutes to check for overlap
              const diffInMinutes = Math.abs((slot.hour * 60 + slot.minute) - (h * 60 + m));
              const slotsAway = diffInMinutes / 30;
              const pxDistance = slotsAway * slotWidth;
              const minPxDistance = 36; // Minimum space required for label to not overlap selected

              if (pxDistance >= minPxDistance) {
                if (duration < 2) {
                  // Standard (40px): Show all
                  isLabelVisible = true;
                } else if (duration < 3) {
                  // Medium (28px): Show every full hour
                  isLabelVisible = isFullHour;
                } else {
                  // Condensed (18px/14px): Show even hours
                  isLabelVisible = isEvenHour;
                }
              }
            }

            return (
              <button
                key={slot.value}
                onClick={() => onChange(slot.value)}
                // Removed transition-all from parent button to prevent width animation from interfering with scroll calculation
                // We only want to animate colors/opacity/transform on children or specific properties
                className="snap-center shrink-0 flex flex-col items-center justify-center gap-4 group outline-none focus:outline-none"
                style={{ width: `${slotWidth}px` }}
              >
                {/* Tick Mark */}
                <div className={clsx(
                  "w-0.5 rounded-full transition-all duration-300",
                  isSelected ? "h-8 bg-primary shadow-md" : (isCondensed && !isFullHour ? "h-2 bg-gray-200" : "h-4 bg-gray-300 group-hover:bg-gray-400")
                )} />
                
                {/* Time Label */}
                <span className={clsx(
                  "text-xs font-medium transition-all duration-300",
                  isSelected ? "text-primary scale-110" : "text-gray-400 group-hover:text-gray-500",
                  isLabelVisible ? "opacity-100" : "opacity-0"
                )}>
                  {slot.displayHour}:{slot.minute.toString().padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
