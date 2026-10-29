# ENTC Lab Quest — Prototype

A responsive, browser-based prototype for a gamified ENTC virtual lab.

## Run it
The project entry point redirects to the authenticated modular version. Serve the project over HTTP (for example with the VS Code Live Server extension) and open `index.html`.

## Supabase setup
The `modules` folder contains separate HTML, CSS, and JavaScript files for Overview, Logic Lab, Signal Playground, Quizzes & Games, ENTC-Bot Tutor, and Teacher Dashboard.

1. Create a Supabase project and run [`modules/schema.sql`](modules/schema.sql) in its SQL Editor. For an existing installation, run [`modules/admin-migration.sql`](modules/admin-migration.sql).
2. Set the project URL and publishable (anon) key in [`modules/supabase-config.js`](modules/supabase-config.js). Never put a service-role key in browser code.
3. In Supabase Dashboard → Authentication → Sign In / Providers → Email, turn off **Confirm email** to allow immediate email-and-password sign-in.
4. Open `modules/login.html` (or `index.html`) from the local web server. Student accounts can be created on the Student Login tab.
5. Promote the first admin from the Supabase SQL Editor, then use Admin Dashboard to grant faculty roles and sections. The SQL examples at the end of `modules/schema.sql` show how to promote accounts and assign sections manually.

The login page has separate Student, Faculty, and Admin options and checks the account's database role before redirecting. The database stores module progress, quiz attempts, and assignments. Row-level security lets students access their own records and their section's assignments; faculty can access data only for sections assigned to them; admins can manage account roles and section assignments. Until Supabase credentials and the schema are configured, authentication reports a configuration error rather than providing a demo login.

If Supabase reports **email rate exceeded**, stop retrying and wait for its email-send limit to reset. If the account already exists, sign in rather than creating it again. Turning off **Confirm email** avoids confirmation emails for new sign-ups; configure custom SMTP in Supabase if you need higher or reliable email delivery. This limit is enforced by Supabase Auth, not the database SQL.

## Included modules
- Student overview with saved XP and section assignments
- Interactive AND / OR / NOT / XOR / NAND logic-gate simulator and truth table
- Signal playground with amplitude, frequency and modulation-depth sliders
- Ten-question quiz with animated feedback, a five-star score rating, answer review, and saved attempts
- ENTC-Bot demo tutor with guided hints
- Faculty dashboard for assigned-section progress and assignments
- Admin dashboard for account roles and section assignments
- Responsive layout for mobile and desktop

## Prototype notes
- The tutor is a rule-based demo, not a connected AI service.
- Teacher access must be explicitly granted by a Supabase administrator.
- Configure and verify the row-level security policies in Supabase before using real student information.
