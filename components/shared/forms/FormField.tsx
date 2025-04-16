"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function FormField({
  // Renamed from Field
  label,
  name,
  type = "text",
  required,
  step,
  min,
  errors,
  as = "input",
  disabled,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  step?: string
  min?: string
  errors?: string[]
  as?: "input" | "textarea"
  disabled?: boolean
  defaultValue?: string | number
}) {
  const id = React.useId()
  const errorId = `${id}-error`
  const InputComponent = as === "textarea" ? Textarea : Input

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <InputComponent
        id={id}
        name={name}
        type={type}
        required={required}
        step={step}
        min={min}
        aria-describedby={errors ? errorId : undefined}
        aria-invalid={!!errors}
        disabled={disabled}
        defaultValue={defaultValue}
        rows={as === "textarea" ? 3 : undefined}
      />
      {errors && (
        <div id={errorId} aria-live="polite" className="text-sm text-destructive">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
    </div>
  )
}
