# NaijaMove Admin Dashboard — UI Design Prompt

## Project Brief

Design the complete web UI for the **NaijaMove Admin Dashboard** — the internal operations tool used by the NaijaMove team to manage the Lagos ride-hailing platform.

The dashboard is a **web application** (not mobile). Design for a 1440×900pt desktop viewport as the primary target, with a responsive sidebar that collapses to an icon rail at 1024pt. Every screen must be designed in **Figma** (or Google Stitch if preferred). Export all screens as a connected prototype.

---

## Brand Identity

**Product name:** NaijaMove Ops
**Tagline:** Run the platform. See everything.

### Colour Palette
| Token | Hex | Usage |
|---|---|---|
| Primary Blue | `#1A6FE8` | CTAs, active nav, links, primary actions |
| Primary Dark | `#0A2D6E` | Sidebar background, page headers, authority moments |
| Primary Light | `#EBF2FD` | Selected row highlights, chip fills, hover states |
| Accent Gold | `#F5A623` | Surge badges, warning states, bonus indicators |
| Surface White | `#FFFFFF` | Card backgrounds, table rows, modal backgrounds |
| Background | `#F0F4FA` | Page background — cool off-white with blue undertone |
| Text Primary | `#0D1B2A` | Body copy, table data, headings |
| Text Secondary | `#64748B` | Labels, captions, secondary data, column headers |
| Danger Red | `#E53935` | Destructive actions, fraud flags, cancellations, errors |
| Success Teal | `#0EA5A0` | Verified states, completed trips, approved drivers |
| Earnings Green | `#16A34A` | Revenue figures, positive ledger entries, payouts confirmed |
| Border Subtle | `#D1DCF0` | Table borders, card outlines, dividers |
| Sidebar Active | `#1A3A6E` | Active nav item background in sidebar |

### Typography
- **Page titles / Section headers:** Inter Bold, 20–28pt
- **Sub-headings / Card titles:** Inter SemiBold, 15–18pt
- **Body / Table data:** Inter Regular, 13–14pt
- **Labels / Captions / Column headers:** Inter Medium, 11–13pt
- **Financial figures / IDs / Codes:** Inter Mono SemiBold, tabular figures — all kobo/naira amounts, reference numbers, phone numbers, plate numbers

### Design Principles
- **Data density over decoration.** Admins need to see a lot at once. Prioritise information over whitespace.
- **Scannable tables.** Every list view is a table with sortable columns, row hover states, and inline actions.
- **Status at a glance.** Every entity (trip, driver, rider, case) has a colour-coded status badge visible without clicking.
- **Destructive actions are protected.** Suspend, ban, cancel, refund — all require a confirmation modal with a reason field.
- **Audit trail visible.** Every action shows who did it and when. Timestamps are always present.
- **No dead ends.** Every entity links to related entities — a trip links to its rider, driver, vehicle, ledger entries, and support cases.

---

## Layout System

### Global Shell
- **Left sidebar (240pt wide, Primary Dark `#0A2D6E` background):**
  - NaijaMove Ops logo + wordmark at top (white)
  - Navigation groups with section labels (Text Secondary, 11pt, uppercase)
  - Active item: `#1A3A6E` background, Primary Blue left border (3pt), white text
  - Inactive item: no background, `#94A3B8` text, icon left
  - Collapsed state (icon rail, 64pt): icons only, tooltips on hover
  - Admin user avatar + name at bottom with logout link
- **Top bar (56pt height, Surface White, Border Subtle bottom border):**
  - Page title (Inter Bold, 20pt, Text Primary) — left
  - Global search bar (centre, 320pt wide): searches trips, riders, drivers, support cases by ID/phone/name
  - Notification bell (with unread badge) + admin avatar (right)
- **Content area:** Background `#F0F4FA`, 24pt padding, scrollable

### Sidebar Navigation Groups

**Overview**
- 📊 Dashboard

**Operations**
- 🚗 Trips
- 🗺 Dispatch
- 📦 Logistics

**People**
- 👤 Riders
- 🧑‍✈️ Drivers
- 🚙 Vehicles

**Finance**
- 💰 Ledger
- 💳 Payments
- 🏦 Payouts

**Business**
- 🏢 Corporate Accounts
- 🚐 Fleet Owners
- 🎁 Promotions
- 📋 Subscriptions

**Platform**
- 💲 Pricing
- 🔍 Fraud
- ✅ Compliance
- 📈 Analytics

**Support**
- 🎧 Support Cases

**Settings**
- ⚙️ Settings

---

## Screen Inventory

---

## Flow 1 — Dashboard Overview

### Screen 1.1 — Main Dashboard
The landing page after login. Shows the health of the platform at a glance.

**KPI row (4 cards, equal width, top of content area):**
- **Trips Today:** large number (Inter Mono Bold, 32pt) · sub-row: completed / cancelled / active counts as chips · trend arrow vs yesterday
- **Active Drivers:** count of drivers currently online · sub-row: total approved drivers · % online rate
- **Revenue Today:** ₦ amount (Inter Mono Bold, 32pt, Earnings Green) · sub-row: platform fees collected · trend vs yesterday
- **Open Support Cases:** count · sub-row: safety cases (Danger Red badge if > 0) · avg response time

**Second row — two columns:**
- **Left (60%): Live Trip Map**
  - Mapbox map showing Lagos
  - Active trip polylines (Primary Blue)
  - Driver markers (Primary Blue car icons, colour-coded by status: online=teal, on-trip=blue, offline=grey)
  - Demand heatmap overlay toggle
  - Legend: Online drivers · Active trips · Surge zones
  - Refresh indicator: "Updated 5s ago"
- **Right (40%): Recent Activity Feed**
  - Live-updating list of platform events (newest at top):
    - Trip created · Trip matched · Trip completed · Driver approved · Fraud signal raised · Support case opened · Payout sent
  - Each row: timestamp (Inter Mono, 12pt) · event icon · description · entity link (clickable)
  - "View all activity" link at bottom

**Third row — three columns:**
- **Trips trend chart (line chart):** trips per hour for today vs yesterday — Primary Blue line vs `#D1DCF0` dashed line
- **Revenue breakdown (donut chart):** platform fees / surge revenue / booking fees / cancellation fees — with legend
- **Driver status breakdown (horizontal bar):** Online / On Trip / Offline / Suspended — colour-coded

**Fourth row — two columns:**
- **Top performing drivers today:** table — rank · avatar · name · trips · earnings · rating
- **Recent fraud signals:** table — signal type · rider/driver · risk score · status badge · "Review" link

---

## Flow 2 — Trips

### Screen 2.1 — Trip List
- **Filter bar (above table):**
  - Status tabs: All · Requested · Matched · In Progress · Completed · Cancelled
  - Date range picker
  - Search input: trip ID, rider phone, driver name
  - Vehicle category filter chip group: Economy · Comfort · Premium · XL
  - Export button (CSV/PDF, top-right)
- **Trips table (full width):**
  - Columns: Trip ID (Inter Mono) · Rider · Driver · Pickup area · Destination area · Category · Fare (₦, Inter Mono) · Status badge · Created at · Actions
  - Row hover: Primary Light `#EBF2FD` background
  - Status badges: Requested (grey) · Matched (Primary Blue) · In Progress (Primary Blue, pulsing dot) · Completed (Success Teal) · Cancelled (Danger Red bg)
  - Actions column: "View" link · "Cancel" link (Danger Red, only for active trips)
  - Sortable columns: Created at · Fare · Status
  - Pagination: 50 rows per page, page controls bottom-right
- **Empty state:** illustration + "No trips match your filters"

### Screen 2.2 — Trip Detail
Full detail page for a single trip. Accessed by clicking "View" on any trip row.

- **Breadcrumb:** Trips > NM-TRIP-00847
- **Header row:** Trip ID (Inter Mono, large) · Status badge · "Cancel Trip" button (Danger Red, right-aligned, only if active)

**Two-column layout:**
- **Left column (60%):**
  - **Route map:** static map showing pickup pin, destination pin, route polyline, stop pins if multi-stop
  - **Trip timeline card:** vertical stepper showing each status transition with timestamp and actor (rider / driver / system)
    - Requested → Matched → Driver Arrived → In Progress → Completed
    - Each step: status label · timestamp (Inter Mono) · actor name
  - **Stops list** (if multi-stop): each stop with address, arrival time, sequence number
  - **Dispatch attempts card:** table — attempt # · drivers contacted · outcome · timestamp

- **Right column (40%):**
  - **Fare breakdown card:**
    - Base fare · Per km · Booking fee · Surge multiplier (if applied, Accent Gold) · Promo discount (if applied, Earnings Green) · Total charged · Platform fee · Net to driver
    - All amounts Inter Mono SemiBold
  - **Rider card:** avatar · name · phone · rating · link to rider profile
  - **Driver card:** avatar · name · phone · rating · vehicle plate · link to driver profile
  - **Vehicle card:** make · model · year · colour · plate · category badge
  - **Payment card:** method · reference · status (paid / pending / refunded)
  - **Ledger entries card:** table of debit/credit entries for this trip — account · type · amount · created at
  - **Support cases card:** list of any support cases linked to this trip — case ref · category · status · "View" link

---

## Flow 3 — Dispatch

### Screen 3.1 — Dispatch Monitor
Real-time view of the dispatch engine.

- **Live map (full width, 400pt height):**
  - All active trips with route polylines
  - All online drivers with markers (colour: waiting=teal, on-trip=blue)
  - Pickup pins for unmatched trips (pulsing Primary Blue)
  - Surge zone overlays (Accent Gold at 20% opacity)

- **Stats row below map (4 cards):**
  - Unmatched trips (count, Danger Red if > 5)
  - Avg match time today (seconds, Inter Mono)
  - Dispatch success rate (%, today)
  - Drivers available now (count)

- **Unmatched trips table:**
  - Columns: Trip ID · Rider · Pickup area · Category · Wait time (Inter Mono, red if > 60s) · Attempts · Actions
  - Actions: "Force Dispatch" button (Primary Blue) — triggers manual dispatch for that trip
  - Row turns Danger Red background if wait > 120s

- **Recent dispatch attempts table:**
  - Columns: Trip ID · Attempt # · Drivers contacted · Outcome badge · Timestamp
  - Outcome badges: Pending (Accent Gold) · Matched (Success Teal) · No Drivers (Danger Red) · Exhausted (Danger Red)

### Screen 3.2 — Nearby Drivers Lookup
Accessed from the "Find Nearby Drivers" action in the dispatch monitor.

- **Input row:** Latitude input · Longitude input · Radius (km) selector · "Search" button
- **Results map:** shows driver markers within radius, ranked by score
- **Results table:** rank · driver name · distance (km) · ETA (min) · rating · trips · score · status

---

## Flow 4 — Riders

### Screen 4.1 — Rider List
- **Filter bar:** search by name/phone · status filter (active / suspended / deleted) · date joined range · export button
- **Riders table:**
  - Columns: Avatar · Name · Phone (Inter Mono) · Trips · Wallet balance (₦, Inter Mono) · Rating · Status badge · Joined · Actions
  - Actions: "View" link
  - Status badges: Active (Success Teal) · Suspended (Danger Red) · Deleted (grey)

### Screen 4.2 — Rider Profile
- **Breadcrumb:** Riders > Amaka Obi
- **Header:** avatar (large, 64pt) · name · phone · status badge · "Suspend Rider" button (Danger Red, right) · "Delete Account" link (Danger Red text)

**Tab navigation below header: Overview · Trips · Wallet · Support Cases · Activity Log**

**Overview tab:**
- Stats row: Total trips · Completed · Cancelled · Cancellation rate · Avg rating given · Rating received
- Profile details card: name · phone · email · joined date · last active
- Saved places card: home address · work address · custom places list
- Emergency contacts card: name · phone · relationship

**Trips tab:**
- Same table as Screen 2.1 but pre-filtered to this rider

**Wallet tab:**
- Balance card: current balance (Inter Mono Bold, 28pt, Earnings Green)
- Transactions table: date · description · type (credit/debit) · amount (Inter Mono) · reference · running balance

**Support Cases tab:**
- Cases table: case ref · category · status badge · opened · last updated · "View" link

**Activity Log tab:**
- Chronological log of all admin actions taken on this account: action · admin user · timestamp · reason

---

## Flow 5 — Drivers

### Screen 5.1 — Driver List
- **Filter bar:** search by name/phone/plate · status filter (pending / approved / suspended / rejected) · online status toggle · vehicle category filter · export button
- **Drivers table:**
  - Columns: Avatar · Name · Phone (Inter Mono) · Vehicle · Category · Trips · Rating · Status badge · Online · Joined · Actions
  - Online indicator: green dot (online) / grey dot (offline)
  - Actions: "View" link · "Approve" button (Success Teal, only for pending) · "Suspend" link (Danger Red)

### Screen 5.2 — Driver Profile
- **Breadcrumb:** Drivers > Emeka Nwosu
- **Header:** avatar · name · phone · status badge · verification badges row (Identity / Licence / Vehicle) · "Approve" button (Success Teal, if pending) · "Suspend" button (Danger Red) · "Go Offline" button (if online)

**Tab navigation: Overview · Documents · Trips · Earnings · Vehicle · Support Cases · Activity Log**

**Overview tab:**
- Stats row: Total trips · Completion rate · Acceptance rate · Cancellation rate · Avg rating · Online hours this week
- Profile details card: name · phone · email · joined · last active · current location (lat/lng, Inter Mono)
- Performance card: rating breakdown bar chart · top compliments chips

**Documents tab:**
- Document list: each row — document type · status badge · uploaded date · expiry date · thumbnail preview · "Approve" / "Reject" / "Request Re-upload" actions
- Rejection flow: clicking "Reject" opens inline reason input + confirm button
- Status badges: Verified (Success Teal) · Pending Review (Accent Gold) · Rejected (Danger Red) · Expiring Soon (Accent Gold) · Expired (Danger Red)

**Trips tab:** pre-filtered trip table for this driver

**Earnings tab:**
- Period selector: Today · This Week · This Month
- Earnings summary card: gross · commission deducted · bonuses · net
- Payout history table: date · amount · bank · status badge · transfer code (Inter Mono)
- Wallet balance card

**Vehicle tab:** vehicle details card (same as Screen 6.2 below)

**Support Cases tab:** pre-filtered cases table

**Activity Log tab:** admin action history for this driver

---

## Flow 6 — Vehicles

### Screen 6.1 — Vehicle List
- **Filter bar:** search by plate/make/model · category filter · status filter (active / suspended) · export button
- **Vehicles table:**
  - Columns: Plate (Inter Mono) · Make · Model · Year · Colour · Category badge · Driver · Status badge · Actions
  - Actions: "View" link · "Suspend" link

### Screen 6.2 — Vehicle Detail
- **Breadcrumb:** Vehicles > LND-234-KJ
- **Header:** plate number (Inter Mono Bold, 24pt) · category badge · status badge · "Suspend Vehicle" button (Danger Red)
- Vehicle details card: make · model · year · colour · plate · category
- Assigned driver card: avatar · name · phone · link to driver profile
- Documents status card: inspection certificate status · insurance status · expiry dates
- Trip history table (pre-filtered to this vehicle)

---

## Flow 7 — Ledger

### Screen 7.1 — Ledger Explorer
The financial audit tool. Every kobo that moves through the platform is visible here.

- **Filter bar:**
  - Account selector (multi-select): rider_wallet · driver_payable · platform_revenue · platform_liability · promo_expense · refund_liability · payout_clearing · corporate_wallet
  - Date range picker
  - Entry type: All · Credit · Debit
  - Reference ID search (Inter Mono input)
  - Export button (CSV)

- **Account balance summary row (cards, one per selected account):**
  - Account name · Credits total (Earnings Green) · Debits total (Danger Red) · Net balance (Inter Mono Bold)

- **Ledger entries table:**
  - Columns: Entry ID (Inter Mono) · Correlation ID (Inter Mono) · Account · Type badge · Amount (₦, Inter Mono) · Reference type · Reference ID (Inter Mono, link) · Actor · Created at
  - Type badges: Credit (Earnings Green bg) · Debit (Danger Red bg)
  - Clicking Correlation ID shows both sides of the double-entry (debit + credit pair) highlighted in Primary Light
  - Clicking Reference ID navigates to the related entity (trip, payout, topup)

### Screen 7.2 — Wallet Balance Lookup
- **Input row:** Owner ID input · Owner type selector (rider / driver / corporate / fleet_owner) · "Look Up" button
- **Result card:** owner name · owner type · current balance (Inter Mono Bold, 28pt) · credits total · debits total
- **Transactions table:** same columns as ledger entries table, filtered to this owner

---

## Flow 8 — Payments & Payouts

### Screen 8.1 — Payments Overview
- **Stats row (4 cards):**
  - Total payments processed today (₦, Inter Mono)
  - Successful transactions count
  - Failed transactions count (Danger Red if > 0)
  - Pending webhook events count (Accent Gold if > 0)

- **Recent transactions table:**
  - Columns: Reference (Inter Mono) · Type (topup / trip / payout) · Rider/Driver · Amount (₦, Inter Mono) · Channel · Status badge · Created at · Actions
  - Status badges: Success (Success Teal) · Pending (Accent Gold) · Failed (Danger Red)
  - Actions: "View Paystack" link (opens Paystack dashboard in new tab)

### Screen 8.2 — Payout Management
- **Stats row:** Total paid out this week (₦) · Pending payouts count · Failed payouts count
- **Settlement cycles table:**
  - Columns: Cycle ID (Inter Mono) · Started at · Drivers paid · Total amount (₦, Inter Mono) · Status badge
  - "Run Settlement Now" button (Primary Blue, top-right) — triggers manual settlement with confirmation modal
- **Payout queue table:**
  - Columns: Driver · Balance (₦, Inter Mono) · Bank · Transfer code (Inter Mono) · Status badge · Initiated at · Actions
  - Actions: "Retry" button (for failed payouts)

---

## Flow 9 — Corporate Accounts

### Screen 9.1 — Corporate Account List
- **Filter bar:** search by company name · status filter · export button
- **Corporate accounts table:**
  - Columns: Company name · Contact · Members · Trips this month · Wallet balance (₦, Inter Mono) · Status badge · Created · Actions
  - Actions: "View" link

### Screen 9.2 — Corporate Account Detail
- **Breadcrumb:** Corporate > Dangote Group
- **Header:** company name · status badge · "Suspend Account" button (Danger Red)

**Tab navigation: Overview · Members · Trips · Wallet**

**Overview tab:**
- Account details card: company name · contact name · contact phone · contact email · created date
- Stats row: total members · trips this month · total spend (₦, Inter Mono)

**Members tab:**
- Members table: name · phone · role (admin/member) · trips · status badge · "Remove" link
- "Add Member" button (Primary Blue)

**Trips tab:** pre-filtered trip table for this corporate account

**Wallet tab:** balance card + transactions table (same pattern as rider wallet tab)

---

## Flow 10 — Fleet Owners

### Screen 10.1 — Fleet Owner List
- **Filter bar:** search by name/phone · status filter · export button
- **Fleet owners table:**
  - Columns: Name · Phone (Inter Mono) · Vehicles · Active drivers · Trips this month · Wallet balance (₦, Inter Mono) · Status badge · Actions
  - Actions: "View" link

### Screen 10.2 — Fleet Owner Detail
- **Breadcrumb:** Fleet > Alhaji Motors
- **Header:** name · phone · status badge · "Suspend" button (Danger Red)

**Tab navigation: Overview · Vehicles · Drivers · Earnings · Wallet**

**Overview tab:** profile details card · stats row (vehicles / drivers / trips / revenue)

**Vehicles tab:** vehicles table pre-filtered to this fleet owner — plate · make · model · assigned driver · status badge

**Drivers tab:** drivers table pre-filtered to this fleet owner

**Earnings tab:** earnings summary card + payout history table

**Wallet tab:** balance card + transactions table

---

## Flow 11 — Promotions & Subscriptions

### Screen 11.1 — Promotions List
- **Filter bar:** search by code · status filter (active / expired / scheduled) · type filter (promo_code / referral / bonus) · export button
- **Promotions table:**
  - Columns: Code · Type badge · Discount · Usage count · Usage limit · Status badge · Valid from · Valid to · Created by · Actions
  - Actions: "View" link · "Deactivate" link (Danger Red, only for active)

### Screen 11.2 — Create / Edit Promotion
- **Form fields:**
  - Code input (uppercase, alphanumeric) · auto-generate button
  - Type selector: Promo Code · Referral · Bonus
  - Discount type: Percentage · Fixed amount (₦)
  - Discount value input (Inter Mono)
  - Minimum fare (₦) input
  - Maximum discount cap (₦) input
  - Usage limit input (blank = unlimited)
  - Per-user limit input
  - Valid from date/time picker · Valid to date/time picker
  - Applicable categories: Economy · Comfort · Premium · XL (multi-select chips)
  - Description / internal note textarea
- "Save Promotion" primary button · "Cancel" ghost button

### Screen 11.3 — Subscriptions List
- **Filter bar:** search by rider name/phone · plan filter · status filter (active / cancelled / expired)
- **Subscriptions table:**
  - Columns: Rider · Plan name · Price (₦/month, Inter Mono) · Status badge · Started · Renews / Expires · Actions
  - Actions: "View" link · "Cancel" link (Danger Red)

---

## Flow 12 — Pricing

### Screen 12.1 — Pricing Config List
- **Filter bar:** city filter · category filter (Economy / Comfort / Premium / XL) · status filter (active / scheduled / expired)
- **Pricing configs table:**
  - Columns: City · Category badge · Base fare (₦, Inter Mono) · Per km (₦) · Per min (₦) · Booking fee (₦) · Platform fee % · Effective from · Effective to · Actions
  - Active row: Success Teal left border
  - Scheduled row: Accent Gold left border
  - Expired row: Text Secondary, muted
  - Actions: "Edit" link · "Duplicate" link

- "Create Config" primary button (top-right)

### Screen 12.2 — Create / Edit Pricing Config
- **Form fields (two-column layout):**
  - City input · Category selector
  - Base fare (₦ kobo input, Inter Mono) · Per km (₦ kobo) · Per min (₦ kobo)
  - Booking fee (₦ kobo) · Cancellation fee (₦ kobo)
  - Floor: fuel estimate (₦ kobo) · wear reserve (₦ kobo) · driver time value (₦ kobo)
  - Platform fee % input · Surge cap multiplier input
  - Effective from datetime picker · Effective to datetime picker (optional)
- **Live fare preview card (right side):**
  - Input: distance (km) · duration (min) · surge multiplier
  - Output: estimated fare breakdown (updates live as fields change)
- "Save Config" primary button · "Cancel" ghost button

### Screen 12.3 — Surge Windows
- **Active surge windows table:**
  - Columns: City · Category · Multiplier badge (Accent Gold) · Reason · Starts at · Ends at · Created by · Actions
  - Actions: "End Now" button (Danger Red, for active surges)
- "Create Surge Window" primary button (top-right)
- **Create Surge Window modal:**
  - City · Category · Multiplier (1.0–5.0 slider + numeric input) · Reason input · Starts at · Ends at
  - "Create" primary button · "Cancel" ghost button

---

## Flow 13 — Fraud

### Screen 13.1 — Fraud Signal Dashboard
- **Stats row (4 cards):**
  - Open signals count (Danger Red if > 0)
  - High-risk signals count
  - Resolved today count
  - Auto-blocked accounts today count

- **Fraud signals table:**
  - Columns: Signal ID (Inter Mono) · Type · Entity (rider/driver + name) · Risk score badge · Status badge · Detected at · Reviewed by · Actions
  - Risk score badges: Low (grey) · Medium (Accent Gold) · High (Danger Red) · Critical (Danger Red, bold)
  - Status badges: Open (Primary Blue) · Under Review (Accent Gold) · Resolved (Success Teal) · False Positive (grey)
  - Actions: "Review" link

### Screen 13.2 — Fraud Signal Detail
- **Breadcrumb:** Fraud > FRD-00291
- **Header:** signal type · risk score badge · status badge · "Mark as False Positive" button · "Block Account" button (Danger Red)

- Signal details card: type · description · detected at · detection method
- Entity card: rider or driver profile summary + link to full profile
- Evidence card: raw signal data (JSON viewer, monospace, scrollable)
- Related signals card: other signals for the same entity
- Resolution card (if resolved): resolution type · resolved by · resolved at · notes

---

## Flow 14 — Compliance

### Screen 14.1 — Compliance Overview
- **Compliance status cards (one per compliance area):**
  - Driver documents · Vehicle inspections · Insurance · Platform licences
  - Each card: compliant count (Success Teal) · expiring soon count (Accent Gold) · expired count (Danger Red)

- **Expiring soon table:**
  - Columns: Entity (driver/vehicle) · Document type · Expiry date · Days remaining (Inter Mono, red if < 7) · Status badge · Actions
  - Actions: "Notify Driver" button · "View Driver" link

- **Compliance report card:**
  - Overall compliance rate (large %, Inter Mono Bold)
  - Breakdown bar chart: compliant / expiring / expired per document type

---

## Flow 15 — Analytics

### Screen 15.1 — Analytics Dashboard
- **Period selector tabs:** Today · This Week · This Month · Custom range

- **Marketplace metrics row (4 cards):**
  - Total trips · Completed trips · Cancellation rate · Avg trip duration (min, Inter Mono)

- **Revenue metrics row (4 cards):**
  - Gross revenue (₦, Earnings Green) · Platform fees (₦) · Surge revenue (₦, Accent Gold) · Refunds issued (₦, Danger Red)

- **Charts section (two columns):**
  - Trips per hour (line chart, today vs previous period)
  - Revenue per day (bar chart, current period)

- **Second charts row (two columns):**
  - Driver supply vs demand (dual-line chart: online drivers vs trip requests per hour)
  - Trip category breakdown (donut chart: Economy / Comfort / Premium / XL)

- **Geographic breakdown table:**
  - Columns: Area (Lagos zone) · Trips · Revenue (₦, Inter Mono) · Avg fare (₦) · Cancellation rate
  - Sortable by any column

### Screen 15.2 — Driver Analytics
- **Driver performance table:**
  - Columns: Driver · Trips · Acceptance rate · Completion rate · Cancellation rate · Avg rating · Online hours · Earnings (₦, Inter Mono)
  - Sortable by any column
  - "View Driver" link on each row

### Screen 15.3 — Revenue Trend
- **Full-width line chart:** daily revenue for the selected period
- **Breakdown table below chart:** date · trips · gross revenue · platform fees · surge revenue · refunds · net revenue — all Inter Mono

---

## Flow 16 — Support Cases

### Screen 16.1 — Support Case List
- **Filter bar:** search by case ref / rider name / driver name · status filter (open / pending / resolved / closed) · category filter · assigned agent filter · date range · export button
- **Cases table:**
  - Columns: Case ref (Inter Mono) · Category icon + label · Rider/Driver · Status badge · Priority badge · Assigned to · Opened · Last updated · Actions
  - Priority badges: Normal (grey) · High (Accent Gold) · Safety (Danger Red)
  - Unread indicator: Primary Blue dot on rows with new rider messages
  - Actions: "View" link · "Assign to Me" link

### Screen 16.2 — Case Detail & Agent Chat
- **Breadcrumb:** Support > NM-2024-00847
- **Header:** case ref (Inter Mono) · category · status badge · priority badge · "Close Case" button · "Escalate" button (Accent Gold) · assigned agent chip

**Two-column layout:**
- **Left (65%): Chat thread**
  - Same bubble architecture as rider/driver apps:
    - Rider messages: right-aligned, Primary Blue bubble, white text
    - Agent messages: left-aligned, Surface White bubble, Border Subtle border, agent name above first in sequence
    - System messages: centred, Text Secondary, italic, 12pt
  - Typing indicator: three animated dots
  - Input bar (pinned bottom): attachment icon · text field · "Send" button (Primary Blue)
  - Quick reply chips above input: "We're looking into this" · "Can you provide more details?" · "This has been resolved"

- **Right (35%): Case sidebar**
  - Case details card: category · submitted date · description · attachments (thumbnail row)
  - Linked trip card (if applicable): trip ID · route · fare · date · "View Trip" link
  - Rider card: avatar · name · phone · rating · "View Profile" link
  - Driver card (if applicable): avatar · name · phone · "View Profile" link
  - Resolution card: resolution type selector · notes textarea · "Mark Resolved" primary button (Success Teal)
  - Activity log: admin actions on this case with timestamps

---

## Flow 17 — Settings

### Screen 17.1 — Admin User Management
- **Admin users table:**
  - Columns: Avatar · Name · Email · Role badge · Last active · Status badge · Actions
  - Role badges: Super Admin (Primary Dark) · Operations (Primary Blue) · Finance (Earnings Green) · Support (Success Teal) · Read Only (grey)
  - Actions: "Edit Role" link · "Deactivate" link (Danger Red)
- "Invite Admin User" primary button (top-right)
- **Invite modal:** email input · role selector · "Send Invite" button

### Screen 17.2 — Platform Settings
- **Sections:**
  - **Dispatch settings:** max dispatch attempts input · offer batch size input · retry delay (seconds) input · minimum payout threshold (₦ kobo, Inter Mono)
  - **Notification settings:** SMS provider toggle (Termii) · push enabled toggle · WhatsApp enabled toggle
  - **Maintenance mode:** toggle with confirmation modal — "This will prevent new trip requests"
- "Save Changes" primary button per section

---

## Global Components

### Tables
- Header row: Background `#F0F4FA`, Text Secondary labels (Inter Medium, 12pt, uppercase), Border Subtle bottom border
- Data rows: Surface White background, Text Primary data (Inter Regular, 13pt), Border Subtle bottom border
- Hover state: Primary Light `#EBF2FD` background
- Selected row: Primary Light background + Primary Blue left border (3pt)
- Sortable column header: sort icon (up/down arrows) appears on hover, active sort shows filled arrow in Primary Blue
- Pagination: "Showing 1–50 of 1,247" label left · page number buttons right · rows-per-page selector

### Modals
- Overlay: `#0D1B2A` at 50% opacity
- Modal card: Surface White, 16pt radius, 480pt max width, 24pt padding
- Header: title (Inter SemiBold, 18pt) + close ✕ icon
- Body: form fields or confirmation message
- Footer: action buttons right-aligned (primary + ghost cancel)
- **Destructive confirmation modals** (suspend, ban, cancel, refund):
  - Danger Red header border (4pt top)
  - Reason textarea (required, min 10 characters)
  - Confirm button: Danger Red fill
  - Entity name shown in bold within the confirmation copy

### Status Badges
- Pill shape, 6pt radius, Inter Medium 12pt
- Completed / Verified / Approved / Active: Success Teal `#0EA5A0` bg, white text
- In Progress / Matched / Open: Primary Blue `#1A6FE8` bg, white text
- Pending / Expiring / Processing: Accent Gold `#F5A623` bg, Primary Dark text
- Cancelled / Suspended / Rejected / Failed: `#FEE2E2` bg, Danger Red `#E53935` text
- Deleted / Closed / Expired: `#F1F5F9` bg, Text Secondary text

### Buttons
- Primary: 36pt height, 12pt radius, Primary Blue fill, white text, Inter SemiBold 14pt
- Secondary: 36pt height, 12pt radius, Surface White fill, Primary Blue border 1.5pt + Primary Blue text
- Destructive: 36pt height, 12pt radius, Danger Red fill, white text
- Ghost: 36pt height, transparent fill, Text Secondary text
- Icon button: 36×36pt, 8pt radius, Background `#F0F4FA` fill, Text Secondary icon — hover: Primary Light fill, Primary Blue icon
- Small variant (inline table actions): 28pt height, 8pt radius, same colour rules

### Form Inputs
- Height: 36pt, 8pt radius, Border Subtle border 1pt, Surface White fill
- Focus: Primary Blue border 2pt
- Label: above field, Text Secondary, Inter Medium 12pt
- Error: Danger Red border + error message below in Danger Red 12pt
- Disabled: `#F1F5F9` fill, Text Secondary text, no border highlight
- Search inputs: magnifier icon left, clear ✕ icon right when populated

### Charts
- Line charts: Primary Blue `#1A6FE8` primary line, `#D1DCF0` comparison line, `#F0F4FA` background, no gridlines (only horizontal reference lines in Border Subtle)
- Bar charts: Primary Blue bars, Accent Gold for surge/bonus bars, Danger Red for refund/cancellation bars
- Donut charts: Primary Blue · Success Teal · Accent Gold · `#8B5CF6` (purple for 4th segment) — legend right-aligned
- All chart tooltips: Surface White card, Border Subtle border, Inter Mono for numbers
- Empty chart state: `#F0F4FA` placeholder with "No data for this period" in Text Secondary

### Toast / Notifications
- Top-right corner, stacked
- Success: Success Teal left border (4pt), Surface White bg, "✓ Action completed" — auto-dismisses after 4s
- Error: Danger Red left border, "✗ Something went wrong" — persists until dismissed
- Info: Primary Blue left border — auto-dismisses after 5s
- Warning: Accent Gold left border — persists until dismissed

### Loading States
- Table skeleton: shimmer rows (3pt height placeholder lines) from `#EBF2FD` to `#D1DCF0`
- Card skeleton: shimmer blocks matching card layout
- Full-page loader: NaijaMove Ops logo centred on Background, Primary Blue spinner below
- Inline spinner: 16pt, Primary Blue, used inside buttons during async actions (button text hidden, spinner centred)

### Empty States
- Illustration (simple line-art, consistent style) + heading (Inter SemiBold, 16pt) + sub-copy (Text Secondary) + optional CTA button
- Tone: operational, not playful — "No trips match your filters" not "Nothing here yet!"

---

## Screen Connections (Prototype Flow)

```
Login → Dashboard (1.1)

Dashboard → Trips list (2.1) → Trip detail (2.2)
Dashboard → Dispatch monitor (3.1) → Nearby drivers lookup (3.2)
Dashboard → Riders list (4.1) → Rider profile (4.2)
Dashboard → Drivers list (5.1) → Driver profile (5.2)
Dashboard → Vehicles list (6.1) → Vehicle detail (6.2)
Dashboard → Ledger explorer (7.1) → Wallet lookup (7.2)
Dashboard → Payments overview (8.1) → Payout management (8.2)
Dashboard → Corporate list (9.1) → Corporate detail (9.2)
Dashboard → Fleet list (10.1) → Fleet detail (10.2)
Dashboard → Promotions list (11.1) → Create promotion (11.2)
Dashboard → Subscriptions list (11.3)
Dashboard → Pricing list (12.1) → Create/edit config (12.2) → Surge windows (12.3)
Dashboard → Fraud dashboard (13.1) → Fraud signal detail (13.2)
Dashboard → Compliance overview (14.1)
Dashboard → Analytics dashboard (15.1) → Driver analytics (15.2) → Revenue trend (15.3)
Dashboard → Support cases list (16.1) → Case detail & chat (16.2)
Dashboard → Settings: admin users (17.1) → Platform settings (17.2)

Trip detail → Rider profile
Trip detail → Driver profile
Trip detail → Vehicle detail
Trip detail → Ledger explorer (filtered to trip)
Trip detail → Support case detail

Driver profile (Documents tab) → Approve/Reject document (inline)
Driver profile (Trips tab) → Trip detail
Driver profile (Earnings tab) → Payout management

Fraud signal detail → Rider profile / Driver profile
Fraud signal detail → Trip detail

Support case detail → Trip detail
Support case detail → Rider profile
Support case detail → Driver profile
```

---

## Deliverables

1. All screens at 1440×900pt desktop viewport — 40+ screens across 17 flows
2. Responsive sidebar behaviour at 1024pt (icon rail collapse)
3. Component library: tables, modals, badges, buttons, inputs, charts, toasts, empty states, loading states
4. Interactive prototype with all flow connections above
5. Dark mode variant for: Dashboard (1.1), Ledger Explorer (7.1), Analytics (15.1)
   - Dark mode: background `#0D1B2A` · surface `#1A2B40` · Primary Blue unchanged · text inverted
6. Annotated specs for spacing, typography, and colour tokens
7. Export-ready assets at 1× and 2× for web integration

---

## Context for the AI Designer

- This is an **internal operations tool**, not a consumer product. Admins are trained staff — prioritise data density and efficiency over onboarding friendliness.
- **Tables are the primary UI pattern.** Every list is a table. Every table has sortable columns, row hover, inline actions, and pagination. Never use card grids for list views.
- **Financial data uses Inter Mono exclusively.** Every ₦ amount, every reference number, every ID, every phone number, every plate number — monospace. This signals precision and makes scanning easier.
- **The sidebar is Primary Dark `#0A2D6E`.** It is the authority anchor of the page. It should feel like a professional tool, not a SaaS dashboard template.
- **Destructive actions are always protected.** Suspend, ban, cancel, refund — always a confirmation modal with a required reason field. The reason is stored in the audit log.
- **Every entity links to every related entity.** A trip links to its rider, driver, vehicle, ledger entries, and support cases. An admin should never need to manually search for related data.
- **The live map on the dashboard is the heartbeat of the platform.** It should feel like a control room — real-time, authoritative, and calm. Not flashy.
- **Fraud and safety signals use Danger Red sparingly but unmistakably.** When something is flagged, it must be impossible to miss.
- **The ledger is insert-only.** The UI must reflect this — no edit buttons on ledger entries, only read and filter.
- **Lagos context:** all amounts in Naira (₦), all times in WAT (UTC+1), phone numbers in +234 format.
- The product name is **NaijaMove Ops** in the admin context — not "NaijaMove Admin" or "Back Office". It should feel like a command centre, not a back-office tool.
