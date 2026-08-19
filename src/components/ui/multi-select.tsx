"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  id?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ id, options, value, onChange, placeholder = "Pilih...", className }: MultiSelectProps) {
  const toggle = (option: string) => {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-[10px] border border-input bg-background px-3 py-2 text-sm shadow-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map((v) => (
              <Badge key={v} variant="secondary">
                {v}
              </Badge>
            ))
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {options.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Tidak ada pilihan.</p>
        )}
        {options.map((option) => {
          const checked = value.includes(option);
          return (
            <DropdownMenuItem
              key={option}
              onSelect={(e) => e.preventDefault()}
              onClick={() => toggle(option)}
              className="justify-between"
            >
              {option}
              {checked && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
