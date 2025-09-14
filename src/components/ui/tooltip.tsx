"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string
  className?: string
  side?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ children, content, className, side = "bottom" }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  const tooltipClasses = cn(
    "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 pointer-events-none transition-opacity duration-200 whitespace-nowrap",
    {
      "bottom-full left-1/2 transform -translate-x-1/2 mb-2": side === "top",
      "top-full left-1/2 transform -translate-x-1/2 mt-2": side === "bottom",
      "right-full top-1/2 transform -translate-y-1/2 mr-2": side === "left",
      "left-full top-1/2 transform -translate-y-1/2 ml-2": side === "right",
    },
    isVisible && "opacity-100",
    className
  )

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div className={tooltipClasses}>
        {content}
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-0 h-0 border-solid",
            {
              "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900 border-l-4 border-r-4 border-t-4": side === "top",
              "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900 border-l-4 border-r-4 border-b-4": side === "bottom",
              "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900 border-t-4 border-b-4 border-l-4": side === "left",
              "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900 border-t-4 border-b-4 border-r-4": side === "right",
            }
          )}
        />
      </div>
    </div>
  )
}