import Link from "next/link";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50">
      <main className="flex flex-col items-center text-center p-8 max-w-3xl">
        <div className="bg-slate-900 p-6 rounded-full mb-8 shadow-lg">
          <Shield className="w-16 h-16 text-emerald-500" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-emerald-400">
          ForensiChain
        </h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl">
          Tamper-Evident Blockchain-Based Digital Evidence Provenance and Chain-of-Custody System.
        </p>
        <div className="flex space-x-4">
          <Link
            href="/login"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            Investigator Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
