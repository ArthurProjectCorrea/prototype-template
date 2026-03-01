'use client';

import * as React from 'react';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { ModeToggle } from '@/components/mode-toggle';
import { useTheme } from 'next-themes';

export function ConfigForm() {
  const { theme, setTheme } = useTheme();
  // keep a local copy for controlling the select but start with current
  const [themeState, setThemeState] = React.useState(theme || 'system');

  React.useEffect(() => {
    if (theme) setThemeState(theme);
  }, [theme]);

  return (
    <form className="flex flex-col gap-6">
      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="cfg-theme">Tema</FieldLabel>
          <ModeToggle
            value={themeState}
            onChange={(v) => {
              setThemeState(v);
              setTheme(v);
            }}
            id="cfg-theme"
          />
        </Field>
      </FieldGroup>
    </form>
  );
}
