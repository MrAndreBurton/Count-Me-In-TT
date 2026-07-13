import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-bold transition",
    isActive
      ? "bg-yellow-200 text-blue-700"
      : "text-gray-700 hover:bg-yellow-50 hover:text-blue-700",
  ].join(" ");

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
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
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink
            to="/games"
            className={navLinkClass}
          >
            Games
          </NavLink>

          <NavLink to="/math-language" className={navLinkClass}>
            Math Language
          </NavLink>

          <NavLink to="/challenges" className={navLinkClass}>
            Challenges
          </NavLink>

          <NavLink to="/leaderboard" className={navLinkClass}>
            Leaderboards
          </NavLink>

          <NavLink to="/membership" className={navLinkClass}>
            Membership
          </NavLink>

          <Link
            to="/games/multiplication"
            className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-blue-700"
          >
            Play Now
          </Link>

          <Link
  to="/login"
  className="ml-1 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-50"
>
  Log In
</Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-label="Open navigation menu"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-black text-black lg:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
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
              to="/games/multiplication"
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

            <Link
  to="/login"
  onClick={closeMenu}
  className="rounded-lg border border-blue-600 bg-white px-4 py-3 text-center font-black text-blue-600"
>
  Log In
</Link>

          </div>
        </nav>
      )}
    </header>
  );
}

