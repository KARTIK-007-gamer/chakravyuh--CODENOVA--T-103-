# ENTC Lab Quest — Prototype

A responsive, browser-based prototype for a gamified ENTC virtual lab.

## Run it
1. Extract the ZIP.
2. Open `index.html` in a modern browser (Chrome recommended).
3. Use the role selector in the top-right to switch between Student and Teacher views.

## Included interactions
- Student overview with XP, progress and recommended activities
- Interactive AND / OR / NOT / XOR / NAND logic-gate simulator and truth table
- Signal playground with amplitude, frequency and modulation-depth sliders
- Three-question quiz with answer feedback and XP
- ENTC-Bot demo tutor with guided hints
- Teacher dashboard with fictional sample students, section filtering, search, mastery heatmap, demo insights, assignment form and CSV export
- Responsive layout for mobile and desktop

## Important prototype notes
- All student records are fictional demo data.
- Progress and XP are held in browser memory and reset when the page is refreshed.
- The tutor is a rule-based demo, not a connected AI service.
- Authentication, persistent database, real-time class updates and live AI require backend integration.

## Suggested production upgrade
Use React + Tailwind, Supabase Auth and Postgres with Row Level Security, and a server-side AI endpoint. Never expose an AI provider API key in browser JavaScript.
