"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-2xl font-bold text-red-700">Erro ao carregar o dashboard</h1>
      <pre className="text-xs bg-red-50 border border-red-200 rounded-md p-4 mx-auto max-w-2xl text-left overflow-auto">
        {error.message}
      </pre>
      <p className="text-sm text-gray-600">
        Causas comuns: planilha privada, GID errado, problema de rede ao acessar o Google Sheets.
        Veja <code>docs/TROUBLESHOOTING.md</code> no repo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-800"
      >
        Tentar novamente
      </button>
    </div>
  );
}
