'use client';

import * as React from 'react';
import { usePermission } from '@/hooks/use-permission';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

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
import {
  Plus,
  SquarePen,
  Trash,
  ChevronDownIcon,
  Settings,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ButtonGroup } from '@/components/ui/button-group';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu as DropdownMenuBase,
  DropdownMenuContent as DropdownMenuContentBase,
  DropdownMenuTrigger as DropdownMenuTriggerBase,
  DropdownMenuItem as DropdownMenuItemBase,
} from '@/components/ui/dropdown-menu';

/**
 * Unified DataTable Component
 *
 * Combines PageTable, PageFilter, and TanStack Table features.
 * Provides:
 * - Multiple filters with search/clear
 * - Column visibility toggle
 * - Sorting
 * - Pagination (internal or external)
 * - Edit/Delete with permission system
 * - Export functionality
 *
 * Props:
 *   - columns: array of { key, label, type?, render?, sortable?, hideable? }
 *   - data: array of row objects
 *   - filters: array of { key, label, component, componentProps? } for filter bar
 *   - screenKey: for permission checking
 *   - onSave: callback for create/update
 *   - onDelete: callback for delete
 *   - EditForm: component for edit/create dialog
 *   - formLoading: loading state for form
 *   - pagination: { page, totalPages, onPageChange }
 *   - rowsPerPage: default 10
 *   - refs: lookup maps for references
 *   - rowAction: custom row action renderer
 *   - headerActions: extra header actions
 *   - showExport: enable export buttons
 *   - onExport: export callback
 */
export function DataTable({
  columns = [],
  data = [],
  filters = [],
  screenKey,
  onSave = () => {},
  onDelete = () => {},
  EditForm,
  formLoading = false,
  pagination,
  rowsPerPage = 10,
  refs = {},
  rowAction,
  headerActions,
  showExport = false,
  onExport,
}) {
  const {
    canEdit,
    canDelete,
    hasPermission,
    canExport: checkExport,
  } = usePermission();

  const allowEdit = !screenKey || canEdit(screenKey);
  const allowDelete = !screenKey || canDelete(screenKey);
  const canExport = !screenKey || checkExport(screenKey);

  // State for filters
  const [filterValues, setFilterValues] = React.useState({});

  // State for table
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [internalSorting, setInternalSorting] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingRow, setDeletingRow] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [internalPage, setInternalPage] = React.useState(1);
  const [internalRowsPerPage, setInternalRowsPerPage] = React.useState(
    rowsPerPage || 10
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns: columns.map((col) => ({
      accessorKey: col.key,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="w-full justify-center"
        >
          {col.label}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    })),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setInternalSorting,
    state: {
      sorting: internalSorting,
    },
  });

  // Apply filters to data
  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(String(value).toLowerCase());
      });
    });
  }, [data, filterValues]);

  // Apply sorting to filtered data
  const sortedData = React.useMemo(() => {
    if (!internalSorting.length) return filteredData;

    const sorted = [...filteredData];
    internalSorting.forEach((sort) => {
      sorted.sort((a, b) => {
        const aVal = a[sort.id];
        const bVal = b[sort.id];
        if (aVal < bVal) return sort.desc ? 1 : -1;
        if (aVal > bVal) return sort.desc ? -1 : 1;
        return 0;
      });
    });
    return sorted;
  }, [filteredData, internalSorting]);

  // Handle pagination
  const useInternalPaging = !pagination;
  const displayData = useInternalPaging
    ? sortedData.slice(
        (internalPage - 1) * internalRowsPerPage,
        internalPage * internalRowsPerPage
      )
    : sortedData;
  const effectivePagination =
    pagination ||
    (useInternalPaging
      ? {
          page: internalPage,
          totalPages: Math.ceil(sortedData.length / internalRowsPerPage) || 1,
          onPageChange: setInternalPage,
        }
      : null);

  const handleEdit = (row) => {
    setEditingRow(row);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingRow(null);
    setOpen(true);
  };

  const handleDeleteTrigger = (row) => {
    setDeletingRow(row);
    setDeleteOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setInternalPage(1); // reset pagination when filtering
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setInternalPage(1);
  };

  return (
    <>
      {/* Filter Bar */}
      {filters.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid gap-4 mb-4 items-end grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                      value={filterValues[key] ?? ''}
                      onChange={(e) => {
                        const v =
                          e && e.target !== undefined ? e.target.value : e;
                        handleFilterChange(key, v);
                      }}
                      onValueChange={(v) => handleFilterChange(key, v)}
                      className="w-full"
                      {...componentProps}
                    />
                  </div>
                )
              )}
            </div>
            <div className="flex justify-end gap-2">
              {showExport && (
                <ButtonGroup>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onExport?.('csv')}
                    disabled={!canExport || !onExport}
                  >
                    Exportar
                  </Button>
                  <DropdownMenuBase>
                    <DropdownMenuTriggerBase asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="pl-2!"
                        disabled={!canExport || !onExport}
                      >
                        <ChevronDownIcon />
                      </Button>
                    </DropdownMenuTriggerBase>
                    <DropdownMenuContentBase align="end" className="w-44">
                      <DropdownMenuItemBase onClick={() => onExport?.('csv')}>
                        CSV
                      </DropdownMenuItemBase>
                      <DropdownMenuItemBase onClick={() => onExport?.('pdf')}>
                        PDF
                      </DropdownMenuItemBase>
                    </DropdownMenuContentBase>
                  </DropdownMenuBase>
                </ButtonGroup>
              )}
              {filters.length > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClearFilters}
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader className="flex items-center justify-between space-x-4 pb-4">
          {/* Left Side: Rows per Page + Pagination */}
          <div className="flex items-center gap-4">
            {/* Rows Per Page Select */}
            <Field orientation="horizontal" className="w-fit m-0">
              <FieldLabel htmlFor="select-rows-per-page" className="text-xs">
                Linhas por página
              </FieldLabel>
              <Select
                value={String(internalRowsPerPage)}
                onValueChange={(val) => {
                  setInternalRowsPerPage(Number(val));
                  setInternalPage(1);
                }}
              >
                <SelectTrigger className="w-20" id="select-rows-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Pagination - Icon Only */}
            {effectivePagination && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    effectivePagination.page > 1 &&
                    effectivePagination.onPageChange(
                      effectivePagination.page - 1
                    )
                  }
                  disabled={effectivePagination.page === 1}
                  title="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {effectivePagination.page} / {effectivePagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    effectivePagination.page < effectivePagination.totalPages &&
                    effectivePagination.onPageChange(
                      effectivePagination.page + 1
                    )
                  }
                  disabled={
                    effectivePagination.page === effectivePagination.totalPages
                  }
                  title="Próximo"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerActions}
            {/* Column Visibility Control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Colunas">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">Colunas</div>
                {columns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    className="capitalize"
                    checked={!columnVisibility[col.key]}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [col.key]: !value,
                      }))
                    }
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {EditForm && allowEdit && (
              <Button size="lg" onClick={handleCreate} disabled={formLoading}>
                Cadastrar <Plus />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="min-h-40">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="even:bg-muted m-0 border-t p-0">
                {columns
                  .filter((col) => !columnVisibility[col.key])
                  .map((col) => (
                    <TableHead
                      key={col.key}
                      className="border px-4 py-2 text-center font-bold"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                <TableHead className="border px-4 py-2 text-center font-bold">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow className="m-0 border-t p-0">
                  <TableCell
                    colSpan={
                      columns.filter((c) => !columnVisibility[c.key]).length + 1
                    }
                    className="text-center py-4"
                  >
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, i) => (
                  <TableRow className="even:bg-muted m-0 border-t p-0" key={i}>
                    {columns
                      .filter((col) => !columnVisibility[col.key])
                      .map((col) => {
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
                            className="border px-4 py-2 text-center"
                          >
                            {cell}
                          </TableCell>
                        );
                      })}
                    <TableCell className="space-x-2 border px-4 py-2 text-center">
                      {rowAction &&
                        rowAction(row, {
                          hasPermission: (perm) =>
                            hasPermission(screenKey, perm),
                        })}
                      {allowEdit && (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => handleEdit(row)}
                        >
                          <SquarePen />
                        </Button>
                      )}
                      {allowDelete && (
                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => handleDeleteTrigger(row)}
                        >
                          <Trash />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      {EditForm && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRow ? 'Editar' : 'Criar'}</DialogTitle>
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

      {/* Delete Confirmation */}
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
                  } catch (err) {
                    // error handling
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
