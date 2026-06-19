import React from "react";
import { Link } from "react-router-dom";

export default function StylesRules() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: "#fce500",
        backgroundImage: `url("/math-bg.svg")`,
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        padding: "30px 20px",
        textAlign: "center",
        color: "#000",
      }}
    >
      <style>{`
        .styles-rules-btn {
          background-color: #000;
          color: #fff;
          padding: 10px 14px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
          line-height: 1;
          display: inline-block;
        }

        .rules-card {
          background: rgba(255,255,255,0.96);
          color: #000;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.22);
          padding: 22px;
          margin: 0 auto 28px;
          max-width: 900px;
          text-align: left;
        }

        .rules-card h2 {
          text-align: center;
          font-size: 26px;
          margin-bottom: 14px;
        }

        .rules-card h3 {
          font-size: 20px;
          margin-top: 18px;
          margin-bottom: 8px;
        }

        .rules-card p,
        .rules-card li {
          font-size: 16px;
          line-height: 1.55;
        }

        .rules-card ul,
        .rules-card ol {
          padding-left: 24px;
        }

        .rules-highlight {
          background: #fff7c2;
          border: 2px solid #000;
          border-radius: 12px;
          padding: 14px;
          font-weight: 700;
          text-align: center;
          margin-top: 12px;
        }

        @media (max-width: 640px) {
          .styles-rules-nav {
            position: static !important;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .styles-rules-btn {
            position: static !important;
            margin: 4px;
          }

          .rules-card {
            padding: 18px;
          }
        }
      `}</style>

      <div
        className="styles-rules-nav"
        style={{ position: "relative", marginBottom: 16, minHeight: 50 }}
      >
        <Link
          to="/styles-challenge"
          className="styles-rules-btn"
          style={{ position: "absolute", left: 16, top: 16 }}
        >
          ⬅ Back to Challenge
        </Link>

        <Link
          to="/styles-leaderboard"
          className="styles-rules-btn"
          style={{ position: "absolute", right: 16, top: 16 }}
        >
          View Leaderboard
        </Link>
      </div>

      <header style={{ marginTop: 50, marginBottom: 34 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <img
            src="/logo-countmeintt.svg"
            alt="Count Me In TT"
            style={{ maxHeight: 180, width: "auto" }}
          />

          {/* Add Styles logo later when ready */}
          {/* <img
            src="/logo-styles-barber-salon.svg"
            alt="Styles Barber Salon"
            style={{ maxHeight: 180, width: "auto" }}
          /> */}
        </div>

        <h1
          style={{
            fontSize: 34,
            marginTop: 20,
            textShadow: "2px 2px 4px rgba(0,0,0,0.35)",
            borderBottom: "4px solid #000",
            display: "inline-block",
            paddingBottom: 8,
          }}
        >
          💈 Styles Barbershop Challenge Rules
        </h1>

        <p
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginTop: 12,
            maxWidth: 760,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.5,
          }}
        >
          Scan. Play in-store. Beat under 20 seconds. Submit your time. Win.
        </p>
      </header>

      <section className="rules-card" style={{ textAlign: "center" }}>
        <h2>Official Challenge Flyer</h2>

        <img
          src="/styles-challenge-flyer.png"
          alt="Styles Barbershop Challenge Flyer"
          style={{
            width: "100%",
            maxWidth: 520,
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            border: "4px solid #000",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <p style={{ fontSize: 14, marginTop: 12, color: "#333" }}>
          Flyer shown for reference. Full rules and prize eligibility details are
          listed below.
        </p>

        
      </section>

      <section className="rules-card">
        <h2>Challenge Summary</h2>

        <p>
          The Styles Barbershop Challenge is a CountMeInTT community challenge
          hosted at Styles Barber Salon. Students visit the shop, scan the QR
          code, play the 5×5 Math Grid, submit their time, and compete for
          monthly prizes.
        </p>

        <div className="rules-highlight">
          Prize-eligible entries must be completed in-store at Styles Barber
          Salon.
        </div>
      </section>

      <section className="rules-card">
        <h2>How to Play</h2>

        <ol>
          <li>Visit Styles Barber Salon.</li>
          <li>Scan the official CountMeInTT Styles Challenge QR code.</li>
          <li>Play the 5×5 multiplication grid.</li>
          <li>Complete the grid as quickly and accurately as possible.</li>
          <li>Submit your time and required parent/guardian contact details.</li>
          <li>Check the Prize Tracker and Leaderboard for updates.</li>
        </ol>
      </section>

      <section className="rules-card">
        <h2>Prize Eligibility</h2>

        <p>A student is prize-eligible only if:</p>

        <ul>
          <li>They are a student.</li>
          <li>They play the 5×5 grid.</li>
          <li>They complete the challenge in under 20 seconds.</li>
          <li>They play in-store at Styles Barber Salon.</li>
          <li>They submit their time through the official form.</li>
          <li>They provide parent/guardian contact information.</li>
          <li>They confirm parent/guardian permission.</li>
          <li>They have not already won a cash prize that month.</li>
          <li>The submission is not suspicious, incomplete, or invalid.</li>
        </ul>

        <div className="rules-highlight">
          Completing the grid under 20 seconds does not automatically guarantee a
          prize. Winners are confirmed after review.
        </div>
      </section>

      <section className="rules-card">
        <h2>$50 Cash Prize</h2>

        <p>
          The first 5 eligible students each month to beat the 5×5 grid in under
          20 seconds can qualify for a $50 cash prize.
        </p>

        <p>
          This prize is based on <strong>submission order</strong>, not fastest
          time.
        </p>

        <p>
          A student may play as many times as they like, but can only win one
          $50 cash prize per month.
        </p>

        <h3>$50 Prize Tracker</h3>

        <p>
          The Prize Tracker shows the first five students who appear to meet the
          automatic prize conditions for the current month. Initial status may
          appear as <strong>Pending Review</strong>. Once verified, the status
          may be updated to <strong>Confirmed Winner</strong>.
        </p>

        <p>
          If a submission is disqualified or cannot be verified, it may be
          removed from the public Prize Tracker and the next eligible student may
          move into the top five.
        </p>
      </section>

      <section className="rules-card">
        <h2>Free Haircut Prize</h2>

        <p>
          The fastest eligible student of the month wins a free haircut from
          Styles Barber Salon.
        </p>

        <p>
          The fastest student can also be one of the $50 cash prize winners.
        </p>

        <p>
          Winners are confirmed after review and contacted by CountMeInTT /
          A’s Online.
        </p>
      </section>

      <section className="rules-card">
        <h2>Prize Tracker vs Leaderboard</h2>

        <h3>Prize Tracker</h3>

        <p>
          The Prize Tracker shows the first five students in line for the $50
          monthly cash prizes. It is sorted by submission order.
        </p>

        <h3>Leaderboard</h3>

        <p>
          The Leaderboard shows the fastest times for the current month. It is
          sorted by best time.
        </p>

        <div className="rules-highlight">
          A student may be high on the Leaderboard but not be one of the first
          five $50 prize winners if the five cash prize spots were already
          filled.
        </div>
      </section>

      <section className="rules-card">
        <h2>Public Name Display</h2>

        <p>
          Public pages only display the student’s first name and surname initial.
        </p>

        <p>Example:</p>

        <ul>
          <li>Jayden S.</li>
          <li>Mia R.</li>
          <li>Ethan B.</li>
        </ul>

        <p>The following information is not shown publicly:</p>

        <ul>
          <li>Full surname</li>
          <li>School name</li>
          <li>Class/Form</li>
          <li>Parent/guardian name</li>
          <li>Phone number</li>
          <li>Email address</li>
        </ul>
      </section>

      <section className="rules-card">
        <h2>Parent/Guardian Permission</h2>

        <p>
          The submission form asks for parent/guardian contact information so
          CountMeInTT / A’s Online can contact the family if the student wins or
          qualifies for challenge updates.
        </p>

        <p>
          Students must confirm that a parent/guardian has given permission for
          CountMeInTT / A’s Online Tutoring Services to contact them if the
          student wins or qualifies for challenge updates.
        </p>
      </section>

      <section className="rules-card">
        <h2>Winner Verification</h2>

        <p>Submissions may be reviewed for:</p>

        <ul>
          <li>Completion time</li>
          <li>In-store participation</li>
          <li>Parent/guardian contact details</li>
          <li>Duplicate winners for the same month</li>
          <li>Suspicious or incomplete entries</li>
        </ul>

        <p>
          CountMeInTT / A’s Online reserves the right to verify, confirm, remove,
          or disqualify entries where necessary.
        </p>
      </section>

      <section className="rules-card">
        <h2>Role of Styles Barber Salon</h2>

        <p>
          Styles Barber Salon is the host location and featured barbershop
          partner for this challenge.
        </p>

        <p>
          CountMeInTT / A’s Online handles the challenge setup, submissions,
          prize review, parent/guardian follow-up, prize payments, and public
          updates.
        </p>

        <p>
          Styles Barber Salon is not responsible for managing submissions,
          contacting winners, or paying cash prizes.
        </p>
      </section>

      <section className="rules-card">
        <h2>Hall of Fame</h2>

        <p>
          The Hall of Fame shows verified winners only. Not every leaderboard
          entry appears in the Hall of Fame.
        </p>

        <p>
          Monthly winners may be added after review and confirmation by
          CountMeInTT / A’s Online.
        </p>
      </section>

      <section
        className="rules-card"
        style={{
          textAlign: "center",
        }}
      >
        <h2>Ready to Play?</h2>

        <p>
          Visit Styles Barber Salon, scan the QR code, and take the challenge.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <Link to="/styles-challenge" className="styles-rules-btn">
            Play Challenge
          </Link>

          <Link to="/styles-leaderboard" className="styles-rules-btn">
            View Leaderboard
          </Link>

          <Link to="/styles-hall-of-fame" className="styles-rules-btn">
            Hall of Fame
          </Link>
        </div>
      </section>

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          marginBottom: "20px",
        }}
      >
        <a
          href="/about-us-contact.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#000",
            fontWeight: "bold",
            textDecoration: "underline",
            fontSize: "16px",
          }}
        >
          About Us/Contact
        </a>
      </div>

      <div
        style={{
          width: "100%",
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "black",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          © 2025 - 2026{" "}
          <span style={{ fontWeight: 600 }}>Count Me In TT</span>. Developed by{" "}
          <span style={{ fontWeight: 600 }}>Andre Burton</span>. Powered by{" "}
          <span style={{ fontWeight: 600 }}>A’s Online</span>. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}

