import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function PositionForm({
  row,
  onClose,
  onSave,
  departments: propDepts = [],
}) {
  const safeRow = row || {};
  const [departments, setDepartments] = React.useState(propDepts);

  React.useEffect(() => {
    if (!propDepts.length) {
      fetch('/api/departments')
        .then((r) => r.json())
        .then(setDepartments)
        .catch(console.error);
    }
  }, [propDepts]);

  const [name, setName] = React.useState(safeRow.name || '');
  const [departmentId, setDepartmentId] = React.useState(
    safeRow.departments
      ? Array.isArray(safeRow.departments)
        ? safeRow.departments[0]
        : safeRow.departments
      : ''
  );

  // single department selected via select component

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      id: safeRow.id,
      name,
      departments: departmentId,
    };
    if (onSave) onSave(payload);
    if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="department">Departamento</FieldLabel>
          <Select
            id="department"
            value={departmentId ? String(departmentId) : ''}
            onValueChange={(v) => setDepartmentId(v ? Number(v) : '')}
            className="w-full"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- selecione --" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </FieldGroup>
    </form>
  );
}
