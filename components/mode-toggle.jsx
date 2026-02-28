'use client';

import * as React from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function ModeToggle({ value, onChange }) {
  const { setTheme, theme } = useTheme();

  const handle = (v) => {
    setTheme(v);
    if (onChange) onChange(v);
  };

  // ensure select always shows current theme as default
  const selected = value || theme || 'system';

  return (
    <Select value={selected} onValueChange={handle} className="w-full">
      <SelectTrigger>
        <SelectValue placeholder="Tema" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <Sun className="size-4 mr-2" /> Claro
        </SelectItem>
        <SelectItem value="dark">
          <Moon className="size-4 mr-2" /> Escuro
        </SelectItem>
        <SelectItem value="system">
          <Globe className="size-4 mr-2" /> Sistema
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
