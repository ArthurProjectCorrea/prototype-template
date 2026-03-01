import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function DepartmentForm({ row, onClose, onSave }) {
  const safeRow = row || {};
  const [name, setName] = React.useState(safeRow.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { id: safeRow.id, name };
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
