# MyGate Society Management Platform

A comprehensive society/apartment management application inspired by MyGate. Built with React, Node.js, Express, PostgreSQL, and Socket.IO.

## Features

### Visitor Management
- Pre-approve visitors with gate pass codes
- Walk-in visitor logging by security
- Approve/reject visitor requests
- Check-in/check-out tracking
- Gate pass verification
- Filter by status and type

### Amenity Booking
- View all society amenities (clubhouse, pool, gym, tennis court, etc.)
- Book amenities with date/time slots
- Conflict detection (no double bookings)
- Cancel bookings
- Per-hour charges

### Complaints & Maintenance
- Raise complaints with category and priority
- Track status: Open → In Progress → Resolved → Closed
- Admin assignment and resolution notes
- Filter by status, category, priority

### Notices & Announcements
- Admin posts notices with categories (general, maintenance, event, emergency, payment, rule)
- Pin important notices
- Priority levels: normal, important, urgent
- Auto-expiry support

### Staff Management
- Register staff (maid, driver, cook, gardener, plumber, electrician, security)
- ID verification tracking
- Assign staff to residents
- Attendance marking (check-in/check-out)
- Filter by staff type

### Bills & Payments
- Admin creates bills for individual or all residents
- Bill types: maintenance, water, electricity, parking, amenity, penalty
- Pay bills online
- Track payment status: pending, paid, overdue, waived
- Admin can waive bills

### Emergency Contacts
- Society-wide emergency directory
- Service types: police, fire, ambulance, hospital, electrician, plumber, society office
- Click-to-call functionality

### Vehicle Registry
- Register vehicles (car, bike, scooter, bicycle)
- Track make, model, color, parking slot
- Admin views all society vehicles

### Residents Directory
- View all society members
- Filter by role (admin, resident, security)
- Contact information

### Real-Time Notifications (Socket.IO)
- Visitor arrival alerts
- Emergency broadcasts
- New notice notifications

### Role-Based Access Control
- **Admin:** Full access — manage society, create bills, post notices, manage staff
- **Resident:** Manage visitors, book amenities, raise complaints, pay bills
- **Security:** Visitor check-in/check-out, staff attendance, gate pass verification

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | Frontend UI |
| Vite 5 | Build tool |
| TailwindCSS 3 | Styling |
| Lucide React | Icons |
| React Router 6 | Client-side routing |
| Axios | HTTP client |
| Node.js 20 | Backend runtime |
| Express 4 | HTTP server |
| Socket.IO 4 | Real-time notifications |
| PostgreSQL | Database |
| JWT | Authentication |
| bcryptjs | Password hashing |

## Project Structure

```
mygate-society/
├── backend/
│   ├── src/
│   │   ├── index.js              # Server entry point
│   │   ├── db/
│   │   │   ├── pool.js           # PostgreSQL connection pool
│   │   │   ├── schema.sql        # Database schema (12 tables)
│   │   │   └── init.js           # DB initialization + seed data
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT auth + role authorization
│   │   └── routes/
│   │       ├── auth.js           # Login, register, profile
│   │       ├── visitors.js       # Visitor management
│   │       ├── amenities.js      # Amenity booking
│   │       ├── complaints.js     # Complaints/maintenance
│   │       ├── notices.js        # Announcements
│   │       ├── staff.js          # Staff management
│   │       ├── bills.js          # Bills & payments
│   │       ├── notifications.js  # Notifications
│   │       ├── emergency.js      # Emergency contacts
│   │       ├── vehicles.js       # Vehicle registry
│   │       └── society.js        # Society info & dashboard
│   ├── test/
│   │   └── test.js               # 55+ API tests
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx               # Routes
│   │   ├── api.js                # Axios instance
│   │   ├── index.css             # TailwindCSS
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── components/
│   │   │   └── Layout.jsx        # Sidebar + header layout
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Visitors.jsx
│   │       ├── Amenities.jsx
│   │       ├── Complaints.jsx
│   │       ├── Notices.jsx
│   │       ├── Staff.jsx
│   │       ├── Bills.jsx
│   │       ├── Emergency.jsx
│   │       ├── Vehicles.jsx
│   │       ├── Profile.jsx
│   │       └── Residents.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Database Schema

12 tables with proper foreign keys, indexes, and constraints:

| Table | Purpose |
|-------|---------|
| societies | Society/apartment info |
| users | Residents, admins, security guards |
| visitors | Visitor management with gate passes |
| amenities | Society amenities |
| amenity_bookings | Amenity reservations |
| complaints | Maintenance requests |
| notices | Announcements |
| staff | Domestic staff records |
| staff_residents | Staff-resident assignments |
| staff_attendance | Staff entry/exit tracking |
| bills | Payment records |
| emergency_contacts | Emergency directory |
| notifications | In-app notifications |
| vehicles | Vehicle registry |

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 10+

### 1. Clone the repository

```bash
git clone https://github.com/Deepika-Sirivella2904/mygate-society.git
cd mygate-society
```

### 2. Set up the database

```bash
# Create a PostgreSQL database
createdb mygate_society

# Or via psql:
psql -U postgres -c "CREATE DATABASE mygate_society;"
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql://username:password@localhost:5432/mygate_society
```

### 4. Initialize database and seed data

```bash
cd backend
npm install
npm run db:init
```

This creates all tables and seeds demo data with these login credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@greenvalley.com | password123 |
| Resident | rahul@greenvalley.com | password123 |
| Security | security@greenvalley.com | password123 |

### 5. Start the backend

```bash
cd backend
npm run dev    # Development (with nodemon)
# or
npm start      # Production
```

Server runs on http://localhost:5000

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### 7. Run tests

```bash
cd backend
npm test
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/password | Change password |

### Visitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/visitors | List visitors |
| POST | /api/visitors | Pre-approve visitor |
| POST | /api/visitors/walkin | Log walk-in (security) |
| PUT | /api/visitors/:id/approve | Approve visitor |
| PUT | /api/visitors/:id/reject | Reject visitor |
| PUT | /api/visitors/:id/checkin | Check in (security) |
| PUT | /api/visitors/:id/checkout | Check out (security) |
| GET | /api/visitors/verify/:code | Verify gate pass |

### Amenities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/amenities | List amenities |
| POST | /api/amenities | Create amenity (admin) |
| PUT | /api/amenities/:id | Update amenity (admin) |
| POST | /api/amenities/:id/book | Book amenity |
| PUT | /api/amenities/bookings/:id/cancel | Cancel booking |
| GET | /api/amenities/my-bookings | My bookings |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/complaints | List complaints |
| POST | /api/complaints | Create complaint |
| PUT | /api/complaints/:id | Update status (admin) |
| DELETE | /api/complaints/:id | Delete complaint |

### Notices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notices | List notices |
| POST | /api/notices | Post notice (admin) |
| PUT | /api/notices/:id | Update notice (admin) |
| DELETE | /api/notices/:id | Delete notice (admin) |

### Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/staff | List staff |
| POST | /api/staff | Register staff (admin) |
| PUT | /api/staff/:id | Update staff (admin) |
| POST | /api/staff/:id/assign | Assign to resident |
| GET | /api/staff/my-staff | My assigned staff |
| POST | /api/staff/:id/attendance | Mark attendance |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bills | List bills |
| POST | /api/bills | Create bill (admin) |
| POST | /api/bills/bulk | Bulk create (admin) |
| PUT | /api/bills/:id/pay | Pay bill |
| PUT | /api/bills/:id/waive | Waive bill (admin) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/emergency | Emergency contacts |
| GET | /api/vehicles | Vehicle registry |
| GET | /api/notifications | Notifications |
| GET | /api/society | Society info |
| GET | /api/society/dashboard | Admin dashboard |
| GET | /api/society/residents | Residents list |

## Demo Screenshots

The application features:
- **Blue-themed modern UI** with responsive sidebar navigation
- **Role-based dashboard** showing relevant stats
- **Card-based layouts** for amenities, staff, vehicles, emergency contacts
- **Table views** for residents, visitors, bills
- **Filter tabs** for status-based filtering
- **Modal forms** for booking and creating entries
- **Badge system** for status indicators (pending, approved, paid, etc.)

## Author

**Deepika Sirivella**
- GitHub: https://github.com/Deepika-Sirivella2904

## License

This project is for educational purposes.
