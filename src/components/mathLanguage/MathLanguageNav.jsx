export default function MathLanguageNav() {
  return (
    <nav className="mx-auto mb-4 flex max-w-2xl items-center justify-between gap-3">
      <a
        href="/math-language"
        className="text-sm font-bold text-gray-600 hover:text-gray-900"
      >
        ← Math Language Home
      </a>

      <a
        href="/math-language/dictionary"
        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
      >
        View Dictionary
      </a>
    </nav>
  );
}

