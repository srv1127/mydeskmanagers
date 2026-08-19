# DeskManagers MVP: shifts, real accounts, roles, support

## 1. Three shifts per seat
Each of the 100 seats gets three independent slots:
- Morning (6 AM – 2 PM), Evening (2 PM – 10 PM), Night (10 PM – 6 AM)
- Plus a **Full day (24 hr)** option that books all three slots for one student.

Seat page changes:
- Shift switcher tabs at the top (Morning / Evening / Night / Full day). The grid shows availability for the selected shift, keeping the same colour language: green = available, red = occupied, yellow = reserved.
- Seat detail dialog shows all three shifts for that seat with the occupant of each, and lets you assign, release or reserve one shift at a time.
- Counters and occupancy stats become shift-aware.
- Student records store a shift alongside the seat number; the admission form and student profile gain a Shift field, and the shift is shown in student lists and receipts.

## 2. Subscription popup on every open/refresh
The pilot dialog shows on every page load (not only the first visit) until a subscription is activated:
- Shows days remaining out of 7, plan pricing, "Continue pilot" and "I have a subscription".
- Once 7 days are used, the app stays fully locked behind the subscription screen.

## 3. Real accounts, roles and a cloud database
Replace on-device storage and the fake login with real cloud accounts and data.

Tables (all access-controlled):
- `profiles` — name, email per user
- `user_roles` — `admin` / `staff` role rows, checked server-side
- `library_settings` — library name, seat count, default fee, receipt prefix
- `students` — name, mobile, email, address, aadhaar, joining date, seat number, shift, monthly fee, deposit, status
- `payments` — student, amount, date, method, month, note
- `activities` — audit feed of admissions, payments, seat changes
- `seat_reservations` — seat + shift marked reserved

Access rules:
- Admin: full access to everything, including revenue, reports and settings.
- Staff: can view and manage students and seats and record payments, but **cannot** see total revenue / collection reports, cannot change settings, cannot delete students or payments.
- Money totals, the reports page, the revenue stat cards and the settings page are hidden and blocked for staff.

Auth:
- Real email + password sign-in plus Google sign-in on the login page, with sign-up for the first admin.
- The first account created becomes admin; subsequent accounts default to staff, and an admin can promote/demote staff from Settings.

## 4. No dummy data
The 64 generated students, fake payments, reserved seats and demo activity feed are removed. A fresh library starts empty with clear empty states ("Add your first student", "No payments recorded yet").

## 5. Footer, support and chat bot
- Global footer: "Developed by **CuriousWeber**" linking to https://curiousweber.in, plus product links.
- Floating support button opens a help chat panel: a scripted assistant answering common questions (how to assign a seat, record a fee, print a receipt, send a WhatsApp reminder, shifts, subscription).
- Panel ends with: "Still not resolved? Contact our support team — **8192931127**" with tap-to-call and WhatsApp links.

## Technical notes
- Data moves from the localStorage context store to cloud-backed queries via server functions; the `useLibrary` API is kept so pages need minimal edits.
- Role checks use a separate `user_roles` table with a security-definer `has_role` function; revenue-bearing reads are gated by admin-only server functions so staff cannot pull them from the client.
- App pages move under an authenticated layout; the login page stays public.
