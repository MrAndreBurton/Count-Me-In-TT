import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import SchoolsPicker from "./SchoolsPicker";
import Leaderboard from "./Leaderboard";
import HallOfFame from "./HallOfFame";
import Challenges from "./Challenges";
import BocasChallenge from "./BocasChallenge";
import BocasLitFestLeaderboard from "./BocasLitFestLeaderboard";
import BocasHallOfFame from "./BocasHallOfFame";

import YouthopiaChallenge from "./pages/YouthopiaChallenge";
import YouthopiaLeaderboard from "./pages/YouthopiaLeaderboard";
import YouthopiaHallOfFame from "./pages/YouthopiaHallOfFame";
import StylesChallenge from "./pages/StylesChallenge";
import StylesLeaderboard from "./pages/StylesLeaderboard";
import StylesHallOfFame from "./pages/StylesHallOfFame";
import StylesRules from "./pages/StylesRules";
import MathLanguagePlay from "./pages/MathLanguagePlay";
import MathLanguageDictionary from "./pages/MathLanguageDictionary";
import MathLanguageHome from "./pages/MathLanguageHome";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Membership from "./pages/Membership";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentLoginSetup from "./pages/StudentLoginSetup";
import Dashboard from "./pages/Dashboard";
import Badges from "./pages/Badges";
import ResultsHistory from "./pages/ResultsHistory";
import EditStudent from "./pages/EditStudent";
import StudentProfile from "./pages/StudentProfile";
import CompleteStudentProfile from "./pages/CompleteStudentProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AddStudent from "./pages/AddStudent";
import Supporters from "./pages/Supporters";
import ResultTest from "./pages/ResultTest";

import CoreGame from "./components/multiplication/CoreGame";
import ScrollToTop from "./components/ScrollToTop";

export default function CountMeInApp() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/games" element={<Games />} />

        <Route
          path="/membership"
          element={<Membership />}
        />

        <Route path="/login" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/students/:studentId/login-setup"
          element={<StudentLoginSetup />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/students/:studentId/badges"
          element={<Badges />}
        />

        <Route
          path="/students/:studentId/results"
          element={<ResultsHistory />}
        />

        <Route
          path="/students/:studentId/edit"
          element={<EditStudent />}
        />

        <Route
          path="/students/:studentId"
          element={<StudentProfile />}
        />

        <Route
          path="/complete-student-profile"
          element={<CompleteStudentProfile />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/students/add"
          element={<AddStudent />}
        />

        <Route
          path="/supporters"
          element={<Supporters />}
        />

        <Route
          path="/development/result-test"
          element={<ResultTest />}
        />

        <Route
          path="/games/multiplication"
          element={
            <CoreGame initialPreset="12x12" />
          }
        />

        <Route
          path="/play"
          element={
            <Navigate
              to="/games/multiplication"
              replace
            />
          }
        />

        <Route
          path="/5x5grid"
          element={
            <CoreGame
              initialPreset="5x5"
              lockPreset
            />
          }
        />

        <Route
          path="/5x12grid"
          element={
            <CoreGame
              initialPreset="5x12"
              lockPreset
            />
          }
        />

        <Route
          path="/12x12grid"
          element={
            <CoreGame
              initialPreset="12x12"
              lockPreset
            />
          }
        />

        <Route
          path="/15x15grid"
          element={
            <CoreGame
              initialPreset="15x15"
              lockPreset
            />
          }
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="/schools"
          element={<SchoolsPicker />}
        />

        <Route
          path="/stx/all"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter={null}
              titleOverride="🏫 St Xavier’s — Whole School"
              classLabel="Prep"
              showExtras={false}
            />
          }
        />

        <Route
          path="/stx/prep2"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 2"
              titleOverride="🏆 St Xavier’s — Prep 2"
              showExtras={false}
            />
          }
        />

        <Route
          path="/stx/prep3"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 3"
              titleOverride="🏆 St Xavier’s — Prep 3"
              showExtras={false}
            />
          }
        />

        <Route
          path="/stx/prep4"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 4"
              titleOverride="🏆 St Xavier’s — Prep 4"
              showExtras={false}
            />
          }
        />

        <Route
          path="/stx/prep5"
          element={
            <Leaderboard
              schoolFilter="St Xavier's Private School"
              classFilter="Prep 5"
              titleOverride="🏆 St Xavier’s — Prep 5"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjg/std2"
          element={
            <Leaderboard
              schoolFilter="San Juan Girls' RC School"
              classFilter="Std 2"
              titleOverride="🏆 San Juan Girls’ RC — Std 2"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjg/std3"
          element={
            <Leaderboard
              schoolFilter="San Juan Girls' RC School"
              classFilter="Std 3"
              titleOverride="🏆 San Juan Girls’ RC — Std 3"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjg/std4"
          element={
            <Leaderboard
              schoolFilter="San Juan Girls' RC School"
              classFilter="Std 4"
              titleOverride="🏆 San Juan Girls’ RC — Std 4"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjg/std5"
          element={
            <Leaderboard
              schoolFilter="San Juan Girls' RC School"
              classFilter="Std 5"
              titleOverride="🏆 San Juan Girls’ RC — Std 5"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjg/all"
          element={
            <Leaderboard
              schoolFilter="San Juan Girls' RC School"
              titleOverride="🏆 San Juan Girls’ RC — Whole School"
              classLabel="Std"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjb/all"
          element={
            <Leaderboard
              schoolFilter="San Juan Boys RC School"
              titleOverride="San Juan Boys’ RC — Leaderboard"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjb/std2"
          element={
            <Leaderboard
              schoolFilter="San Juan Boys RC School"
              classFilter="Std 2"
              titleOverride="SJBRC — Std 2 Leaderboard"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjb/std3"
          element={
            <Leaderboard
              schoolFilter="San Juan Boys RC School"
              classFilter="Std 3"
              titleOverride="SJBRC — Std 3 Leaderboard"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjb/std4"
          element={
            <Leaderboard
              schoolFilter="San Juan Boys RC School"
              classFilter="Std 4"
              titleOverride="SJBRC — Std 4 Leaderboard"
              showExtras={false}
            />
          }
        />

        <Route
          path="/sjb/std5"
          element={
            <Leaderboard
              schoolFilter="San Juan Boys RC School"
              classFilter="Std 5"
              titleOverride="SJBRC — Std 5 Leaderboard"
              showExtras={false}
            />
          }
        />

        <Route
          path="/hall-of-fame"
          element={<HallOfFame />}
        />

        <Route
          path="/challenges"
          element={<Challenges />}
        />

        <Route
          path="/bocas-2026"
          element={<BocasChallenge />}
        />

        <Route
          path="/youthopia-2"
          element={<YouthopiaChallenge />}
        />

        <Route
          path="/youthopia-leaderboard"
          element={<YouthopiaLeaderboard />}
        />

        <Route
          path="/bocaslitfest2026"
          element={<BocasLitFestLeaderboard />}
        />

        <Route
          path="/bocas-hall-of-fame"
          element={<BocasHallOfFame />}
        />

        <Route
          path="/youthopia-hall-of-fame"
          element={<YouthopiaHallOfFame />}
        />

        <Route
          path="/styles-challenge"
          element={<StylesChallenge />}
        />

        <Route
          path="/styles-leaderboard"
          element={<StylesLeaderboard />}
        />

        <Route
          path="/styles-hall-of-fame"
          element={<StylesHallOfFame />}
        />

        <Route
          path="/styles-rules"
          element={<StylesRules />}
        />

        <Route
          path="/math-language/play"
          element={<MathLanguagePlay />}
        />

        <Route
          path="/math-language/dictionary"
          element={<MathLanguageDictionary />}
        />

        <Route
          path="/math-language"
          element={<MathLanguageHome />}
        />
      </Routes>
    </Router>
  );
}


