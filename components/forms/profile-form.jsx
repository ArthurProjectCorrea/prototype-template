'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group';
import { toast } from 'sonner';

export function ProfileForm() {
  const [user, setUser] = React.useState(null);
  const [positions, setPositions] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setName(u.name || '');
      setEmail(u.email || '');
    }

    fetch('/api/positions')
      .then((r) => r.json())
      .then(setPositions)
      .catch(console.error);
    fetch('/api/departments')
      .then((r) => r.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const [loading, setLoading] = React.useState(false);

  const saveField = async (field, value) => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = { id: user.id };
      payload[field] = value;
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Perfil atualizado');
      if (field === 'password') setPassword('');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const positionName =
    positions.find((p) => p.id === user.position_id)?.name || '';
  // position record holds department id in `departments` field
  const departmentId = positions.find(
    (p) => p.id === user.position_id
  )?.departments;
  const departmentName =
    departments.find((d) => d.id === departmentId)?.name || '';

  return (
    <form className="flex flex-col gap-6">
      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Field>
            <FieldLabel htmlFor="pf-name">Nome</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="pf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <InputGroupButton
                size="sm"
                onClick={() => saveField('name', name)}
                loading={loading}
              >
                Salvar
              </InputGroupButton>
            </InputGroup>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="pf-email">Email</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <InputGroupButton
              size="sm"
              onClick={() => saveField('email', email)}
              loading={loading}
            >
              Salvar
            </InputGroupButton>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="pf-password">Senha</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="pf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
            />
            <InputGroupButton type="submit" size="sm" loading={loading}>
              Salvar
            </InputGroupButton>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="pf-position">Cargo</FieldLabel>
          <Input id="pf-position" value={positionName} disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="pf-department">Departamento</FieldLabel>
          <Input id="pf-department" value={departmentName} disabled />
        </Field>
      </FieldGroup>
    </form>
  );
}
