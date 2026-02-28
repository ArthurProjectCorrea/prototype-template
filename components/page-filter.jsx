'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

/**
 * A generic filter bar that renders a row of controls based on a
 * configuration array. Each config entry should provide:
 *   - key: the name of the filter value
 *   - label: text label for the control
 *   - component: a React component to render (Input, Select, etc.)
 *   - componentProps: optional props to pass to the component
 *
 * The component maintains its own state map and calls `onChange`
 * with the current values whenever any input updates. Consumers
 * can use that object to filter their data.
 *
 * @param {{
 *   filters: Array<{key:string,label:string,component:React.ComponentType,componentProps?:object}>,
 *   values?: object,               // controlled values for the inputs
 *   onSearch?: (values:object)=>void, // called when the search button is clicked
 *   onClear?: ()=>void,
 *   showExport?: boolean,
 *   onExport?: (format: 'csv' | 'pdf')=>void,
 *   className?:string
 * }} props
 */
export function PageFilter({
  filters = [],
  values: valuesProp = {},
  onSearch = () => {},
  onClear,
  showExport = false,
  onExport,
  className,
}) {
  const [values, setValues] = React.useState(valuesProp);

  React.useEffect(() => {
    setValues(valuesProp);
  }, [valuesProp]);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <Card>
      <CardContent>
        <div
          className={
            className ||
            'grid gap-4 mb-4 items-end grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }
        >
          {filters.map(
            ({ key, label, component: Component, componentProps = {} }) => (
              <div key={key} className="flex flex-col w-full">
                <label
                  className="text-sm font-medium mb-1"
                  htmlFor={`filter-${key}`}
                >
                  {label}
                </label>
                <Component
                  id={`filter-${key}`}
                  value={values[key] ?? ''}
                  onChange={(e) => {
                    // normalize value from event or direct
                    const v = e && e.target !== undefined ? e.target.value : e;
                    handleChange(key, v);
                  }}
                  onValueChange={(v) => handleChange(key, v)}
                  {...componentProps}
                />
              </div>
            )
          )}
        </div>
        <div className="flex justify-end gap-2">
          {/* action buttons */}

          {showExport && onExport && (
            <ButtonGroup>
              {/* primary export action (CSV) */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => onExport('csv')}
              >
                Exportar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="!pl-2">
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          )}

          {onClear && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setValues({});
                onClear();
              }}
            >
              Limpar
            </Button>
          )}
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              onSearch(values);
            }}
          >
            Pesquisar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
