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
  departments: propDepartments = [],
}) {
  // `row` may be null when creating a new entry – fall back to empty object
  const safeRow = row || {};
  const [positions, setPositions] = React.useState(propPositions);
  const [departments, setDepartments] = React.useState(propDepartments);

  React.useEffect(() => {
    if (!propPositions.length && !positions.length) {
      fetch('/api/positions')
        .then((r) => r.json())
        .then(setPositions)
        .catch(console.error);
    }
  }, [propPositions.length, positions.length]);

  React.useEffect(() => {
    if (!propDepartments.length && !departments.length) {
      fetch('/api/departments')
        .then((r) => r.json())
        .then(setDepartments)
        .catch(console.error);
    }
  }, [propDepartments.length, departments.length]);

  const [name, setName] = React.useState(safeRow.name || '');
  const [email, setEmail] = React.useState(safeRow.email || '');
  const [departmentId, setDepartmentId] = React.useState(() => {
    // Tenta inicializar o departamento baseado no position_id inicial
    if (safeRow.position_id && propPositions.length) {
      const currentPosition = propPositions.find(
        (p) => String(p.id) === String(safeRow.position_id)
      );
      if (currentPosition?.departments) {
        return String(currentPosition.departments);
      }
    }
    return '';
  });
  const [positionId, setPositionId] = React.useState(
    safeRow.position_id ? String(safeRow.position_id) : ''
  );

  // Inicializa departmentId baseado no cargo quando positions carregar via fetch
  React.useEffect(() => {
    if (row?.position_id && positions.length && !departmentId) {
      const currentPosition = positions.find(
        (p) => String(p.id) === String(row.position_id)
      );
      if (currentPosition?.departments) {
        setDepartmentId(String(currentPosition.departments));
      }
    }
  }, [row?.position_id, positions, departmentId]);

  // Filtra cargos pelo departamento selecionado
  const filteredPositions = React.useMemo(() => {
    if (!departmentId) return [];
    return positions.filter(
      (p) => String(p.departments) === String(departmentId)
    );
  }, [positions, departmentId]);

  // Limpa cargo se departamento mudar e cargo não pertencer ao novo departamento
  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    const positionBelongsToDept = positions.find(
      (p) =>
        String(p.id) === String(positionId) &&
        String(p.departments) === String(value)
    );
    if (!positionBelongsToDept) {
      setPositionId('');
    }
  };

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
        <div className="grid grid-cols-2 gap-4">
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
            <FieldLabel htmlFor="department">Departamento</FieldLabel>
            <Select
              value={departmentId ? String(departmentId) : ''}
              onValueChange={handleDepartmentChange}
              disabled={loading}
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
          <Field>
            <FieldLabel htmlFor="position">Cargo</FieldLabel>
            <Select
              value={positionId ? String(positionId) : ''}
              onValueChange={(v) => setPositionId(v ? Number(v) : '')}
              disabled={loading || !departmentId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- selecione --" />
              </SelectTrigger>
              <SelectContent>
                {filteredPositions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
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
