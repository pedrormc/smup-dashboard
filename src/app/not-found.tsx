import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-gray-600 mt-2">A rota pedida não existe.</p>
      <Link href="/" className="mt-6 inline-block text-blue-600 underline">
        Voltar à Visão Executiva
      </Link>
    </div>
  );
}
