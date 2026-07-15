import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { supabase } from "../../lib/supabase";

const gameLinks = [
  {
    label: "Games",
    to: "/games",
  },
  {
    label: "Multiplication",
    to: "/games/multiplication",
  },
  {
    label: "Math Language",
    to: "/math-language",
  },
  {
    label: "Leaderboard",
    to: "/leaderboard",
  },
  {
    label: "Hall of Fame",
    to: "/hall-of-fame",
  },
];

function getFirstName(fullName = "") {
  return (
    fullName.trim().split(/\s+/)[0] || "Player"
  );
}

function getInitials(fullName = "") {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[
    words.length - 1
  ].charAt(0)}`.toUpperCase();
}

function isCurrentPath(pathname, destination) {
  if (destination === "/games") {
    return pathname === "/games";
  }

  if (destination === "/math-language") {
    return pathname.startsWith("/math-language");
  }

  if (destination === "/games/multiplication") {
    return (
      pathname === "/games/multiplication" ||
      pathname === "/play" ||
      pathname === "/5x5grid" ||
      pathname === "/5x12grid" ||
      pathname === "/12x12grid" ||
      pathname === "/15x15grid"
    );
  }

  return pathname === destination;
}

export default function GameHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const accountMenuRef = useRef(null);

  const [user, setUser] = useState(null);
  const [accountProfile, setAccountProfile] =
    useState(null);

  const [isLoadingAccount, setIsLoadingAccount] =
    useState(true);

  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccount(
      authenticatedUser
    ) {
      if (!authenticatedUser) {
        if (!active) return;

        setUser(null);
        setAccountProfile(null);
        setIsLoadingAccount(false);
        return;
      }

      setUser(authenticatedUser);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            account_type,
            account_status
          `
        )
        .eq("id", authenticatedUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error(
          "Game header profile loading error:",
          error
        );

        setAccountProfile({
          id: authenticatedUser.id,
          full_name:
            authenticatedUser.user_metadata
              ?.full_name ||
            authenticatedUser.email ||
            "Player",
          account_type:
            authenticatedUser.user_metadata
              ?.account_type || null,
          account_status: null,
        });
      } else {
        setAccountProfile(
          data || {
            id: authenticatedUser.id,
            full_name:
              authenticatedUser.user_metadata
                ?.full_name ||
              authenticatedUser.email ||
              "Player",
            account_type:
              authenticatedUser.user_metadata
                ?.account_type || null,
            account_status: null,
          }
        );
      }

      setIsLoadingAccount(false);
    }

    async function initialiseAccount() {
      setIsLoadingAccount(true);

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(
          "Game header authentication error:",
          error
        );
      }

      await loadAccount(currentUser || null);
    }

    initialiseAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadAccount(session?.user || null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(
          event.target
        )
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, []);

  useEffect(() => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const fullName =
    accountProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Player";

  const firstName = getFirstName(fullName);
  const initials = getInitials(fullName);

  const accountType =
    accountProfile?.account_type ||
    user?.user_metadata?.account_type ||
    null;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setAccountMenuOpen(false);
      setMobileMenuOpen(false);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Game header logout error:",
        error
      );

      setLogoutError(
        error?.message ||
          "You could not be logged out. Please try again."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
   <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/games"
          className="flex shrink-0 items-center gap-3"
          aria-label="CountMeInTT home"
        >
          <img
  src="/CountmeIn Logo No bg.png"
  alt="CountMeInTT"
  className="h-11 w-auto object-contain"
/>

          <div className="leading-tight">
            <p className="text-lg font-black text-gray-950">
              CountMeInTT
            </p>

            <p className="hidden text-xs font-bold text-gray-500 sm:block">
              Play. Practise. Improve.
            </p>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Game navigation"
        >
          {gameLinks.map((link) => {
            const active = isCurrentPath(
              location.pathname,
              link.to
            );

            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-black transition",
                  active
                    ? "bg-yellow-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-700",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isLoadingAccount ? (
            <div className="hidden h-10 w-28 animate-pulse rounded-xl bg-gray-100 sm:block" />
          ) : user ? (
            <div
              ref={accountMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setAccountMenuOpen(
                    (current) => !current
                  )
                }
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-sm font-black text-blue-700">
                  {initials}
                </span>

                <span className="hidden sm:block">
                  <span className="block max-w-32 truncate text-sm font-black text-gray-950">
                    {firstName}
                  </span>

                  <span className="block text-xs font-semibold capitalize text-gray-500">
                    {accountType || "Account"}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={[
                    "text-xs font-black text-gray-500 transition",
                    accountMenuOpen
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                >
                  ▼
                </span>
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                >
                  <div className="border-b border-gray-100 bg-yellow-50 p-4">
                    <p className="truncate font-black text-gray-950">
                      {fullName}
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-600">
                      {user.email}
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                      {accountType === "parent"
                        ? "Parent Account"
                        : accountType === "student"
                          ? "Student Account"
                          : "CountMeInTT Account"}
                    </span>
                  </div>

                  <div className="grid p-2">
                    <Link
                      role="menuitem"
                      to="/dashboard"
                      className="rounded-lg px-3 py-2.5 text-sm font-black text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Dashboard
                    </Link>

                    <Link
                      role="menuitem"
                      to="/games"
                      className="rounded-lg px-3 py-2.5 text-sm font-black text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      All Games
                    </Link>

                    <Link
                      role="menuitem"
                      to="/membership"
                      className="rounded-lg px-3 py-2.5 text-sm font-black text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      Membership
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                      className="rounded-lg px-3 py-2.5 text-left text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoggingOut
                        ? "Logging Out..."
                        : "Log Out"}
                    </button>
                  </div>

                  {logoutError && (
                    <p className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {logoutError}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-xl border-2 border-blue-600 bg-white px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-50"
              >
                Log In
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-blue-700"
              >
                Join
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            aria-expanded={mobileMenuOpen}
            aria-label="Open game navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl font-black text-gray-800 transition hover:bg-gray-100 lg:hidden"
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav
            className="mx-auto grid max-w-7xl gap-2"
            aria-label="Mobile game navigation"
          >
            {gameLinks.map((link) => {
              const active = isCurrentPath(
                location.pathname,
                link.to
              );

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={[
                    "rounded-xl px-4 py-3 font-black transition",
                    active
                      ? "bg-yellow-100 text-blue-700"
                      : "bg-gray-50 text-gray-800 hover:bg-blue-50 hover:text-blue-700",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}

            {user ? (
              <Link
                to="/dashboard"
                className="rounded-xl bg-blue-600 px-4 py-3 text-center font-black text-white"
              >
                My Dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="rounded-xl border-2 border-blue-600 bg-white px-4 py-3 text-center font-black text-blue-600"
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-center font-black text-white"
                >
                  Join
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

