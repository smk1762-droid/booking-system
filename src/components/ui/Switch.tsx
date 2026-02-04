"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <label htmlFor={switchId} className={cn("flex items-start cursor-pointer", className)}>
        <div className="relative">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div
            className={cn(
              "w-11 h-6 bg-gray-200 rounded-full peer",
              "peer-checked:bg-blue-600 peer-disabled:bg-gray-100",
              "transition-colors duration-200"
            )}
          />
          <div
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow",
              "peer-checked:translate-x-5 peer-disabled:bg-gray-50",
              "transition-transform duration-200"
            )}
          />
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && <span className="text-sm font-medium text-gray-900">{label}</span>}
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
