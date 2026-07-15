import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { supabase } from "../../lib/supabase";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-bold transition",
    isActive
      ? "bg-yellow-200 text-blue-700"
      : "text-gray-700 hover:bg-yellow-50 hover:text-blue-700",
  ].join(" ");

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

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const desktopAccountMenuRef = useRef(null);
  const mobileAccountMenuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false);

  const [user, setUser] = useState(null);
  const [accountProfile, setAccountProfile] =
    useState(null);

  const [isLoadingAccount, setIsLoadingAccount] =
    useState(true);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [logoutError, setLogoutError] =
    useState("");

  const closeMenu = () => {
    setMenuOpen(false);
  };

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
          "Site header profile loading error:",
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
          "Site header authentication error:",
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
    const clickedInsideDesktop =
      desktopAccountMenuRef.current?.contains(
        event.target
      );

    const clickedInsideMobile =
      mobileAccountMenuRef.current?.contains(
        event.target
      );

    if (
      !clickedInsideDesktop &&
      !clickedInsideMobile
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
    setMenuOpen(false);
    setAccountMenuOpen(false);
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
      setMenuOpen(false);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Site header logout error:",
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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <img
            src="/as-online-logo.svg"
            alt="A's Online"
            className="h-10 w-auto rounded-md ring-1 ring-black/10 sm:h-11"
          />

          <div>
            <p className="text-lg font-black leading-tight text-blue-600 sm:text-xl">
              Count Me In TT!
            </p>

            <p className="text-[11px] font-semibold text-gray-600">
              Powered by A&apos;s Online
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink
            to="/"
            end
            className={navLinkClass}
          >
            Home
          </NavLink>

          <NavLink
            to="/games"
            className={navLinkClass}
          >
            Games
          </NavLink>

          <NavLink
            to="/math-language"
            className={navLinkClass}
          >
            Math Language
          </NavLink>

          <NavLink
            to="/challenges"
            className={navLinkClass}
          >
            Challenges
          </NavLink>

          <NavLink
            to="/leaderboard"
            className={navLinkClass}
          >
            Leaderboards
          </NavLink>

          <NavLink
            to="/membership"
            className={navLinkClass}
          >
            Membership
          </NavLink>

          <Link
            to="/games/multiplication"
            className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-blue-700"
          >
            Play Now
          </Link>

          {isLoadingAccount ? (
            <div className="ml-1 h-10 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <div
  ref={desktopAccountMenuRef}
  className="relative ml-1"
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
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-sm font-black text-blue-700">
                  {initials}
                </span>

                <span>
                  <span className="block max-w-28 truncate text-sm font-black text-gray-950">
                    {firstName}
                  </span>

                  <span className="block text-[11px] font-semibold capitalize text-gray-500">
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
            <Link
              to="/login"
              className="ml-1 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-50"
            >
              Log In
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          {!isLoadingAccount && user && (
            <div
  ref={mobileAccountMenuRef}
  className="relative"
>
              <button
                type="button"
                onClick={() =>
                  setAccountMenuOpen(
                    (current) => !current
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-sm font-black text-blue-700"
                aria-label="Open account menu"
              >
                {initials}
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 bg-yellow-50 p-4 text-left">
                    <p className="truncate font-black text-gray-950">
                      {fullName}
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-600">
                      {user.email}
                    </p>
                  </div>

                  <div className="grid p-2">
                    <Link
                      to="/dashboard"
                      className="rounded-lg px-3 py-2.5 text-sm font-black text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Dashboard
                    </Link>

                    <Link
                      to="/games"
                      className="rounded-lg px-3 py-2.5 text-sm font-black text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      All Games
                    </Link>

                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                      className="rounded-lg px-3 py-2.5 text-left text-sm font-black text-red-600 hover:bg-red-50"
                    >
                      {isLoggingOut
                        ? "Logging Out..."
                        : "Log Out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current
              )
            }
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-black text-black"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={closeMenu}
            >
              Home
            </NavLink>

            <NavLink
              to="/games"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Games
            </NavLink>

            <NavLink
              to="/math-language"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Math Language
            </NavLink>

            <NavLink
              to="/challenges"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Challenges
            </NavLink>

            <NavLink
              to="/leaderboard"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Leaderboards
            </NavLink>

            <NavLink
              to="/membership"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Membership
            </NavLink>

            <Link
              to="/games/multiplication"
              onClick={closeMenu}
              className="rounded-lg bg-blue-600 px-4 py-3 text-center font-black text-white"
            >
              Play Now
            </Link>

            {user ? (
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="rounded-lg border border-blue-600 bg-white px-4 py-3 text-center font-black text-blue-600"
              >
                My Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-lg border border-blue-600 bg-white px-4 py-3 text-center font-black text-blue-600"
              >
                Log In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

