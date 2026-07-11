"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormSelectProps = {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string | null;
  disabled?: boolean;
  id?: string;
  name: string;
  onValueChange?: (value: string | null) => void;
  placeholder: string;
  required?: boolean;
  value?: string | null;
};

function FormSelect({ children, className, defaultValue, disabled, id, name, onValueChange, placeholder, required, value }: FormSelectProps) {
  return <Select defaultValue={defaultValue} disabled={disabled} id={id} name={name} onValueChange={onValueChange} required={required} value={value}>
    <SelectTrigger className={cn("w-full", className)}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>;
}

export { FormSelect };
