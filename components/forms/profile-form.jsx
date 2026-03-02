'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/lib/error-handler';
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
  const { user: authUser, profile: authProfile, refreshProfile } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);

  const [positions, setPositions] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loadingField, setLoadingField] = React.useState(null);

  // Carregar positions e departments
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const { data: positionsData } = await supabase
          .from('positions')
          .select('*');
        if (positionsData) setPositions(positionsData);

        const { data: departmentsData } = await supabase
          .from('departments')
          .select('*');
        if (departmentsData) setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [supabase]);

  // Inicializar campos quando profile carregar
  React.useEffect(() => {
    if (authProfile) {
      setName(authProfile.name || '');
      setEmail(authProfile.email || authUser?.email || '');
    }
  }, [authProfile, authUser]);

  // Salvar nome (na tabela profile)
  const saveName = async () => {
    if (!name.trim()) {
      toast.error('Nome não pode estar vazio');
      return;
    }
    setLoadingField('name');
    try {
      const { error } = await supabase
        .from('profile')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', authUser.id);

      if (error) throw error;

      // Atualizar profile no contexto
      if (refreshProfile) await refreshProfile();

      toast.success('Nome atualizado');
    } catch (err) {
      const errorMsg = handleSupabaseError(err, 'profile.updateName');
      toast.error(errorMsg);
    } finally {
      setLoadingField(null);
    }
  };

  // Salvar email (no Supabase Auth + profile)
  const saveEmail = async () => {
    if (!email.trim()) {
      toast.error('Email não pode estar vazio');
      return;
    }
    setLoadingField('email');
    try {
      // Atualizar no Auth
      const { error } = await supabase.auth.updateUser({
        email: email.trim(),
      });
      if (error) throw error;

      // Profile será atualizado pelo trigger sync_profile_email ou manualmente
      await supabase
        .from('profile')
        .update({ email: email.trim(), updated_at: new Date().toISOString() })
        .eq('id', authUser.id);

      if (refreshProfile) await refreshProfile();

      toast.success(
        'Email atualizado. Verifique seu email para confirmar a alteração.'
      );
    } catch (err) {
      const errorMsg = handleSupabaseError(err, 'profile.updateEmail');
      toast.error(errorMsg);
    } finally {
      setLoadingField(null);
    }
  };

  // Salvar senha (no Supabase Auth)
  const savePassword = async () => {
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoadingField('password');
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      if (error) throw error;
      toast.success('Senha atualizada');
      setPassword('');
    } catch (err) {
      const errorMsg = handleSupabaseError(err, 'profile.updatePassword');
      toast.error(errorMsg);
    } finally {
      setLoadingField(null);
    }
  };

  if (!authUser || !authProfile) return null;

  const positionName =
    positions.find((p) => p.id === authProfile.position_id)?.name || '';
  const departmentId = positions.find(
    (p) => p.id === authProfile.position_id
  )?.department_id;
  const departmentName =
    departments.find((d) => d.id === departmentId)?.name || '';

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Field>
            <FieldLabel htmlFor="pf-name">Nome</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="pf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <InputGroupButton
                size="sm"
                onClick={saveName}
                loading={loadingField === 'name'}
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
              autoComplete="email"
              required
            />
            <InputGroupButton
              size="sm"
              onClick={saveEmail}
              loading={loadingField === 'email'}
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
              autoComplete="new-password"
            />
            <InputGroupButton
              size="sm"
              onClick={savePassword}
              loading={loadingField === 'password'}
            >
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
