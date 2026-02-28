export default function PublicPage() {
  return (
    <div className="flex h-svh items-center justify-center">
      <h1 className="text-3xl font-bold">Bem‑vindo à página pública!</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Esta rota está em <code>/(public)</code> e não exige que você esteja
        autenticado para acessá‑la.
      </p>
    </div>
  );
}
