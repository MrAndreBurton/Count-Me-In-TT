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

import BocasCouvaChallenge from "./pages/BocasCouvaChallenge";
import BocasCouvaLeaderboard from "./pages/BocasCouvaLeaderboard";

import BocasArimaChallenge from "./pages/BocasArimaChallenge";
import BocasArimaLeaderboard from "./pages/BocasArimaLeaderboard";

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
import MathLanguageLevel1Home from "./pages/MathLanguageLevel1Home";

import SymbolBankHome from "./pages/SymbolBankHome";
import SymbolBankVault from "./pages/SymbolBankVault";
import SymbolBankSymbol from "./pages/SymbolBankSymbol";

import Home from "./pages/Home";
import Games from "./pages/Games";
import Membership from "./pages/Membership";
import MembershipRequest from "./pages/MembershipRequest";
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

import AdminRoute from "./components/admin/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WorkspaceSelector from "./pages/WorkspaceSelector";

import StudentsPage from "./pages/admin/StudentsPage";
import StudentProfilePage from "./pages/admin/StudentProfilePage";
import EditStudentPage from "./pages/admin/EditStudentPage";
import AddStudentPage from "./pages/admin/AddStudentPage";

import ParentsPage from "./pages/admin/ParentsPage";
import ParentProfilePage from "./pages/admin/ParentProfilePage";
import AddParentPage from "./pages/admin/AddParentPage";
import EditParentPage from "./pages/admin/EditParentPage";

import MembershipsPage from "./pages/admin/MembershipsPage";
import MembershipProfilePage from "./pages/admin/MembershipProfilePage";
import MembershipRequestsPage from "./pages/admin/MembershipRequestsPage";
import MembershipRequestProfilePage from "./pages/admin/MembershipRequestProfilePage";

import MathLanguageLevel2Home from "./pages/MathLanguageLevel2Home";
import MathLanguageLevel2Dictionary from "./pages/MathLanguageLevel2Dictionary";
import MathLanguageLevel2Play from "./pages/MathLanguageLevel2Play";

import MathLanguageLevel3Home from "./pages/MathLanguageLevel3Home";
import MathLanguageLevel3Dictionary from "./pages/MathLanguageLevel3Dictionary";
import MathLanguageLevel3Play from "./pages/MathLanguageLevel3Play";

import SymbolBankMyVault from "./pages/SymbolBankMyVault";
import SymbolChallenge from "./pages/SymbolChallenge";

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

        <Route
          path="/membership/request"
          element={<MembershipRequest />}
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
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/workspace"
          element={<WorkspaceSelector />}
        />

        <Route
          path="/admin/students"
          element={
            <AdminRoute>
              <StudentsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/students/new"
          element={
            <AdminRoute>
              <AddStudentPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/students/:studentId"
          element={
            <AdminRoute>
              <StudentProfilePage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/students/:studentId/edit"
          element={
            <AdminRoute>
              <EditStudentPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/parents"
          element={
            <AdminRoute>
              <ParentsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/parents/new"
          element={
            <AdminRoute>
              <AddParentPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/parents/:parentId/edit"
          element={
            <AdminRoute>
              <EditParentPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/parents/:parentId"
          element={
            <AdminRoute>
              <ParentProfilePage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/memberships"
          element={
            <AdminRoute>
              <MembershipsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/memberships/requests"
          element={<MembershipRequestsPage />}
        />

        <Route
          path="/admin/memberships/requests/:requestId"
          element={<MembershipRequestProfilePage />}
        />

        <Route
          path="/admin/memberships/:membershipId"
          element={
            <AdminRoute>
              <MembershipProfilePage />
            </AdminRoute>
          }
        />

        <Route
          path="/games/multiplication"
          element={<CoreGame initialPreset="12x12" />}
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
          path="/bocas-couva-challenge"
          element={<BocasCouvaChallenge />}
        />

        <Route
          path="/bocas-couva-leaderboard"
          element={<BocasCouvaLeaderboard />}
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
          path="/bocas-arima-challenge"
          element={<BocasArimaChallenge />}
        />

        <Route
          path="/bocas-arima-leaderboard"
          element={<BocasArimaLeaderboard />}
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

        {/* Math Language — Unified Level Architecture */}

        <Route
          path="/math-language"
          element={<MathLanguageHome />}
        />

        <Route
          path="/math-language/level-1"
          element={<MathLanguageLevel1Home />}
        />

        <Route
          path="/math-language/level-1/play"
          element={<MathLanguagePlay />}
        />

        <Route
          path="/math-language/level-1/dictionary"
          element={<MathLanguageDictionary />}
        />

        <Route
          path="/math-language/level-2"
          element={<MathLanguageLevel2Home />}
        />

        <Route
          path="/math-language/level-2/dictionary"
          element={<MathLanguageLevel2Dictionary />}
        />

        <Route
          path="/math-language/level-2/play"
          element={<MathLanguageLevel2Play />}
        />

        <Route
          path="/math-language/level-3"
          element={<MathLanguageLevel3Home />}
        />

        <Route
          path="/math-language/level-3/dictionary"
          element={<MathLanguageLevel3Dictionary />}
        />

        <Route
          path="/math-language/level-3/play"
          element={<MathLanguageLevel3Play />}
        />

        {/* Legacy Math Language routes */}

        <Route
          path="/math-language/play"
          element={
            <Navigate
              to="/math-language/level-1/play"
              replace
            />
          }
        />

        <Route
          path="/math-language/dictionary"
          element={
            <Navigate
              to="/math-language/level-1/dictionary"
              replace
            />
          }
        />

        {/* Previous Level 2 / Level 3 development URLs */}

        <Route
          path="/development/math-language-level2"
          element={
            <Navigate
              to="/math-language/level-2/play"
              replace
            />
          }
        />

        <Route
          path="/development/math-language-level3"
          element={
            <Navigate
              to="/math-language/level-3/play"
              replace
            />
          }
        />

        <Route
          path="/symbol-bank"
          element={<SymbolBankHome />}
        />

        <Route
          path="/symbol-bank/vault"
          element={<SymbolBankVault />}
        />

        <Route
          path="/symbol-bank/vault/:symbolId"
          element={<SymbolBankSymbol />}
        />

        <Route
          path="/symbol-bank/my-vault"
          element={<SymbolBankMyVault />}
        />

        <Route
          path="/symbol-bank/challenge"
          element={<SymbolChallenge />}
        />
      </Routes>
    </Router>
  );
}
