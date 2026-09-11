export default function BloqueadoPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-20 text-center">
      <p className="text-4xl">⏸️</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
        Plataforma temporariamente indisponível
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        Contacta o administrador da tua equipa para mais informações.
      </p>
    </div>
  );
}
