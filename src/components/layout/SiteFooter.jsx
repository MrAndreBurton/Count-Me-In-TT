import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="bg-gray-950 px-5 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-xl font-black">Count Me In TT!</h2>

          <p className="mt-3 max-w-xs text-sm leading-6 text-gray-300">
            Building maths confidence through fun games, competition,
            challenges and meaningful practice.
          </p>
        </div>

        <div>
          <h3 className="font-black text-yellow-300">Explore</h3>

          <div className="mt-3 grid gap-2 text-sm text-gray-300">

            <Link to="/games" className="hover:text-white">
              All Games
            </Link>

            <Link
              to="/games/multiplication"
              className="hover:text-white"
            >
              Multiplication Game
            </Link>

            <Link to="/math-language" className="hover:text-white">
              Math Language
            </Link>

            <Link to="/challenges" className="hover:text-white">
              Challenges
            </Link>

            <Link to="/leaderboard" className="hover:text-white">
              Leaderboards
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-black text-yellow-300">CountMeInTT</h3>

          <div className="mt-3 grid gap-2 text-sm text-gray-300">
            <Link to="/supporters" className="hover:text-white">
              Our Supporters
            </Link>

            <Link to="/membership" className="hover:text-white">
             Membership
            </Link>

            <span className="text-gray-500">
              For Schools — Coming Soon
            </span>

            <a
              href="/about-us-contact.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              About & Contact
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-black text-yellow-300">Legal</h3>

          <div className="mt-3 grid gap-2 text-sm text-gray-300">
            <a
              href="/privacy-policy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Privacy Policy
            </a>

            <a
              href="/terms-of-use.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/15 pt-5 text-center text-xs leading-5 text-gray-400">
        © 2025–2026 Count Me In TT. Developed by Andre Burton.
        Powered by A&apos;s Online. All rights reserved.
      </div>
    </footer>
  );
}

