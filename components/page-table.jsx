'use client';

import * as React from 'react';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, SquarePen, Trash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
/**
 * A reusable table wrapped in a card. Columns are defined as objects with
 * `key` and `label`.
 * Optional fields on a column object:
 *   - `type: 'date'` for formatting ISO/Date values (includes hours:minutes, no seconds)
 *   - `render: (value,row)=>ReactNode` custom cell renderer
 *
 * Data is an array of objects; keys are used to access values. The component
 * can optionally show a "Criar" button and open a dialog for creating or
 * editing rows.
 *
 * Props:
 *   - columns: array of column definitions
 *   - data: array of row objects
 *   - onDelete: callback when delete button is clicked
 *   - onCreate: callback when create button is clicked/opened
 *   - onSave: callback called with the new/updated row when form submits
 *   - EditForm: React component rendered inside the dialog; receives
 *       props `{row, onClose, onSave}` where `row` will be the selected row or
 *       null when creating.
 *   - pagination: optional object { page, totalPages, onPageChange }
 *   - rowsPerPage: number of rows that triggers automatic pagination when
 *       `pagination` prop is not supplied (default 10). Once the table has more
 *       rows than this threshold it will internally paginate and render controls.
 *   - refs: optional object mapping column keys to either
 *       lookup objects (id->label) or functions `(value,row)=>any` for
 *       converting referenced ids into display values.
 *   - headerActions: React node rendered in the header before the create
 *       button. Useful for passing a custom button/component (e.g. <AppUser />).
 *   - rowAction: optional function `(row)=>ReactNode` rendered alongside
 *       the standard edit/delete buttons in each action cell. Can be used for
 *       per-row custom buttons.
 */
export function PageTable({
  columns = [],
  data = [],
  onDelete = () => {},
  onCreate = () => {},
  onSave = () => {},
  formLoading = false,
  pagination,
  rowsPerPage = 10,
  refs = {},
  EditForm,
  headerActions,
  rowAction,
}) {
  const [open, setOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingRow, setDeletingRow] = React.useState(null);
  const [deleteError, setDeleteError] = React.useState('');
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // internal pagination state when `pagination` prop not provided
  const [internalPage, setInternalPage] = React.useState(1);

  const handleEdit = (row) => {
    setEditingRow(row);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingRow(null);
    setOpen(true);
    if (onCreate) onCreate();
  };

  const handleDeleteTrigger = (row) => {
    setDeletingRow(row);
    setDeleteOpen(true);
  };

  // determine whether to use internal paging
  const useInternalPaging = !pagination && data.length > rowsPerPage;
  const displayData = useInternalPaging
    ? data.slice((internalPage - 1) * rowsPerPage, internalPage * rowsPerPage)
    : data;
  const effectivePagination =
    pagination ||
    (useInternalPaging
      ? {
          page: internalPage,
          totalPages: Math.ceil(data.length / rowsPerPage) || 1,
          onPageChange: setInternalPage,
        }
      : null);

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-end space-x-2">
          {headerActions}
          {EditForm && (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleCreate} disabled={formLoading}>
                Cadastrar <Plus />{' '}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="min-h-40">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="even:bg-muted m-0 border-t p-0">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="border px-4 py-2 text-center font-bold [[align=center]]:text-center [[align=right]]:text-right"
                  >
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="border px-4 py-2 text-center font-bold [[align=center]]:text-center [[align=right]]:text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow className="m-0 border-t p-0">
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center py-4"
                  >
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, i) => (
                  <TableRow className="even:bg-muted m-0 border-t p-0" key={i}>
                    {columns.map((col) => {
                      let cell = row[col.key];
                      if (col.type === 'date' && cell != null) {
                        cell = new Date(cell).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        });
                      }
                      if (col.render) {
                        cell = col.render(cell, row);
                      }
                      // apply reference lookup if provided
                      if (refs[col.key]) {
                        const ref = refs[col.key];
                        if (typeof ref === 'function') {
                          cell = ref(cell, row);
                        } else if (cell != null && ref[cell] !== undefined) {
                          cell = ref[cell];
                        }
                      }
                      return (
                        <TableCell
                          key={col.key}
                          className="border px-4 py-2 text-center [[align=center]]:text-center [[align=right]]:text-right"
                        >
                          {cell}
                        </TableCell>
                      );
                    })}
                    <TableCell className="space-x-2 border px-4 py-2 text-center [[align=center]]:text-center [[align=right]]:text-right">
                      {rowAction && rowAction(row)}
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => handleEdit(row)}
                      >
                        <SquarePen />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => handleDeleteTrigger(row)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {effectivePagination && effectivePagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationPrevious
              onClick={() =>
                effectivePagination.page > 1 &&
                effectivePagination.onPageChange(effectivePagination.page - 1)
              }
            />
            <PaginationContent>
              {Array.from(
                { length: effectivePagination.totalPages },
                (_, i) => i + 1
              ).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={pageNum === effectivePagination.page}
                    onClick={() => effectivePagination.onPageChange(pageNum)}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
            <PaginationNext
              onClick={() =>
                effectivePagination.page < effectivePagination.totalPages &&
                effectivePagination.onPageChange(effectivePagination.page + 1)
              }
            />
          </Pagination>
        </div>
      )}

      {EditForm && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <EditForm
              row={editingRow}
              onClose={() => setOpen(false)}
              onSave={onSave}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              {deletingRow ? deletingRow.name : 'este item'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              loading={deleteLoading}
              onClick={async () => {
                if (deletingRow) {
                  setDeleteLoading(true);
                  try {
                    await onDelete(deletingRow);
                    setDeleteOpen(false);
                    setDeleteError('');
                  } catch (err) {
                    // don't log expected errors to console
                    setDeleteError(err.message || 'Erro ao excluir.');
                  } finally {
                    setDeleteLoading(false);
                  }
                } else {
                  setDeleteOpen(false);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
