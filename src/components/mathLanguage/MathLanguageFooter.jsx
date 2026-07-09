export default function MathLanguageFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-gray-100 bg-white px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-bold text-gray-800">
            © {currentYear} A&apos;s Online Tutoring Services
          </p>

          <p className="text-sm text-gray-500">
            CountMeInTT Math Language Challenge — learn the words behind the
            questions.
          </p>
        </div>

        <nav className="flex justify-center gap-4 text-sm font-bold text-gray-600">
          <a href="/math-language" className="hover:text-gray-900">
            Home
          </a>

          <a href="/math-language/dictionary" className="hover:text-gray-900">
            Dictionary
          </a>

          <a href="/math-language/play" className="hover:text-gray-900">
            Challenge
          </a>
        </nav>
      </div>
    </footer>
  );
}

