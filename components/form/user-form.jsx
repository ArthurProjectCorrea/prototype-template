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

export function UserForm({
  row,
  onClose,
  onSave,
  loading = false,
  positions: propPositions = [],
}) {
  // `row` may be null when creating a new entry – fall back to empty object
  const safeRow = row || {};
  const [positions, setPositions] = React.useState(propPositions);

  React.useEffect(() => {
    if (!propPositions.length) {
      fetch('/api/positions')
        .then((r) => r.json())
        .then(setPositions)
        .catch(console.error);
    }
  }, [propPositions]);
  const [name, setName] = React.useState(safeRow.name || '');
  const [email, setEmail] = React.useState(safeRow.email || '');
  const [positionId, setPositionId] = React.useState(safeRow.position_id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { id: safeRow.id, name, email, position_id: positionId };
    if (onSave) {
      onSave(payload);
    } else {
      console.log('submit user', payload);
    }
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
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="position">Cargo</FieldLabel>
          <Select
            value={positionId ? String(positionId) : ''}
            onValueChange={(v) => setPositionId(v ? Number(v) : '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- selecione --" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Salvar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
