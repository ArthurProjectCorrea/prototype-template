import * as React from 'react';

import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import users from '@/database/users.json';
import { Button } from '@/components/ui/button';
import { SquarePen, Trash } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-2 p-2">
      <Card>
        <CardHeader>
          <PageHeader
            title="Cadastro de Usuários"
            description="Gerencie os acessos da plataforma"
            routes={[
              { title: 'Configuração do Sistema' },
              { title: 'Cadastro de Usuários' },
            ]}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="even:bg-muted m-0 border-t p-0">
                <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                  Nome
                </TableHead>
                <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                  Email
                </TableHead>
                <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                  Cargo
                </TableHead>
                <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                  Criado em
                </TableHead>
                <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                  Atualizado em
                </TableHead>
                <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow className="even:bg-muted m-0 border-t p-0" key={i}>
                  <TableCell className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                    {u.name}
                  </TableCell>
                  <TableCell className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                    {u.email}
                  </TableCell>
                  <TableCell className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                    {u.positions}
                  </TableCell>
                  <TableCell className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                    {new Date(u.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="space-x-2 border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                    <Button variant="outline" size="icon" aria-label="Submit">
                      <SquarePen />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label="Submit"
                    >
                      <Trash />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
