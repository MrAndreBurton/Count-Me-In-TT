import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function SchoolSearchSelect({
  schoolType,
  value,
  onChange,
  required = false,
  disabled = false,
}) {
  const [schools, setSchools] = useState([]);
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    let active = true;

    async function loadSchools() {
      if (
        schoolType !== "primary" &&
        schoolType !== "secondary"
      ) {
        setSchools([]);
        setLoadError("");
        return;
      }

      setIsLoading(true);
      setLoadError("");

      const schoolFile =
        schoolType === "secondary"
          ? "/secondary-schools.json"
          : "/primary-schools.json";

      try {
        const response = await fetch(schoolFile, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const schoolList = Array.isArray(data?.schools)
          ? [
              ...new Set(
                data.schools
                  .map((school) =>
                    String(school || "").trim()
                  )
                  .filter(Boolean)
              ),
            ].sort((a, b) =>
              a.localeCompare(b, "en", {
                sensitivity: "base",
              })
            )
          : [];

        if (!active) return;

        setSchools(schoolList);
      } catch (error) {
        console.error(
          "Unable to load school list:",
          error
        );

        if (!active) return;

        setSchools([]);
        setLoadError(
          "The school list could not be loaded."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSchools();

    return () => {
      active = false;
    };
  }, [schoolType]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const filteredSchools = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return schools.slice(0, 50);
    }

    return schools
      .filter((school) =>
        school.toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [query, schools]);

  function handleInputChange(event) {
    const nextValue = event.target.value;

    setQuery(nextValue);
    setIsOpen(true);

    if (value) {
      onChange("");
    }
  }

  function selectSchool(school) {
    setQuery(school);
    onChange(school);
    setIsOpen(false);
  }

  const hasValidSelection =
    Boolean(value) && schools.includes(value);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={query}
          required={required}
          disabled={
            disabled ||
            !schoolType ||
            isLoading
          }
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          placeholder={
            !schoolType
              ? "Select learning category first"
              : isLoading
                ? "Loading schools..."
                : "Search for a school or institution"
          }
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-11 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {isOpen &&
        !disabled &&
        schoolType &&
        !isLoading && (
          <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <button
                  key={school}
                  type="button"
                  onClick={() =>
                    selectSchool(school)
                  }
                  className={[
                    "block w-full rounded-xl px-4 py-3 text-left text-sm transition",
                    value === school
                      ? "bg-yellow-50 font-black text-slate-950"
                      : "font-medium text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {school}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm font-medium text-slate-500">
                No matching schools found.
              </p>
            )}

            <div className="mt-2 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() =>
                  selectSchool("Homeschool")
                }
                className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Homeschool
              </button>

              <button
                type="button"
                onClick={() =>
                  selectSchool(
                    "Not currently enrolled"
                  )
                }
                className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Not currently enrolled
              </button>

              <button
                type="button"
                onClick={() =>
                  selectSchool("Other")
                }
                className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                School or institution not listed
              </button>
            </div>
          </div>
        )}

      {loadError && (
        <p className="mt-2 text-sm font-semibold text-red-600">
          {loadError}
        </p>
      )}

      {required &&
        query &&
        !hasValidSelection &&
        value !== "Homeschool" &&
        value !== "Not currently enrolled" &&
        value !== "Other" && (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Select a school from the results.
          </p>
        )}
    </div>
  );
}
