"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  /** Kalau diisi, muncul opsi "+ Tambah ..." saat teks yang diketik belum ada di `options`. */
  onCreateOption?: (value: string) => void;
  createLabel?: (value: string) => string;
  placeholder?: string;
}

/**
 * Input teks bebas + saran dari data yang sudah ada + opsi "buat baru".
 * Dibangun manual (bukan library cmdk/dsb) supaya tidak nambah dependency.
 */
export function Combobox({
  id,
  value,
  onChange,
  options,
  onCreateOption,
  createLabel,
  placeholder,
}: ComboboxProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => setQuery(value), [value]);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  const selectOption = (option: string) => {
    onChange(option);
    setQuery(option);
    setIsOpen(false);
  };

  const createNew = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onCreateOption?.(trimmed);
    onChange(trimmed);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-[10px] border border-border bg-card p-1 shadow-card">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(option)}
              className="flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              {option}
              {option === value && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}

          {query.trim() && !exactMatch && onCreateOption && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={createNew}
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-sm text-primary hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              {createLabel ? createLabel(query.trim()) : `Tambah "${query.trim()}"`}
            </button>
          )}

          {filtered.length === 0 && !query.trim() && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Ketik untuk mencari...</p>
          )}
        </div>
      )}
    </div>
  );
}
