import {
  NavLink,
} from "react-router-dom";

import SiteHeader from "../layout/SiteHeader";
import SiteFooter from "../layout/SiteFooter";

const navClass = ({
  isActive,
}) =>
  [
    "rounded-xl px-4 py-2 text-sm font-black transition",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100",
  ].join(" ");

export default function SymbolBankShell({
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          aria-label="Mathematics Symbol Bank"
        >
          <NavLink
            to="/symbol-bank"
            end
            className={
              navClass
            }
          >
            Bank
          </NavLink>

          <NavLink
            to="/symbol-bank/vault"
            end
            className={
              navClass
            }
          >
            Vault
          </NavLink>

          <NavLink
            to="/symbol-bank/my-vault"
            className={
              navClass
            }
          >
            My Vault
          </NavLink>

          <NavLink
            to="/symbol-bank/challenge"
            className={
              navClass
            }
          >
            Challenge
          </NavLink>
        </nav>

        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
