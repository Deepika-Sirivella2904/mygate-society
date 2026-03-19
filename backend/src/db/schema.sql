-- MyGate Society Management — Database Schema
-- Run this file to initialize all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SOCIETIES
-- ============================================================
CREATE TABLE IF NOT EXISTS societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    total_units INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USERS (Residents, Admins, Security Guards)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('admin', 'resident', 'security')),
    flat_number VARCHAR(20),
    block VARCHAR(20),
    profile_image VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VISITORS
-- ============================================================
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_phone VARCHAR(15),
    visitor_type VARCHAR(30) NOT NULL DEFAULT 'guest' CHECK (visitor_type IN ('guest', 'delivery', 'cab', 'service', 'other')),
    vehicle_number VARCHAR(20),
    purpose TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_in', 'checked_out')),
    approved_by UUID REFERENCES users(id),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    gate_pass_code VARCHAR(10),
    is_preapproved BOOLEAN DEFAULT false,
    expected_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AMENITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    capacity INTEGER,
    booking_required BOOLEAN DEFAULT true,
    open_time TIME DEFAULT '06:00',
    close_time TIME DEFAULT '22:00',
    charge_per_hour DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AMENITY BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS amenity_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    total_charge DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS / MAINTENANCE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('plumbing', 'electrical', 'cleaning', 'security', 'parking', 'noise', 'structural', 'pest_control', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- NOTICES / ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(30) DEFAULT 'general' CHECK (category IN ('general', 'maintenance', 'event', 'emergency', 'payment', 'rule')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    is_pinned BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STAFF (Maids, Drivers, Cooks, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    staff_type VARCHAR(30) NOT NULL CHECK (staff_type IN ('maid', 'driver', 'cook', 'gardener', 'plumber', 'electrician', 'security', 'other')),
    photo VARCHAR(500),
    id_proof VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STAFF-RESIDENT MAPPING (which staff works for which resident)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    schedule TEXT,
    entry_time TIME,
    exit_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, resident_id)
);

-- ============================================================
-- STAFF ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    check_in TIMESTAMP NOT NULL DEFAULT NOW(),
    check_out TIMESTAMP,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BILLS / PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    bill_type VARCHAR(30) NOT NULL CHECK (bill_type IN ('maintenance', 'water', 'electricity', 'parking', 'amenity', 'penalty', 'other')),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
    paid_at TIMESTAMP,
    payment_method VARCHAR(30),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- EMERGENCY CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('police', 'fire', 'ambulance', 'hospital', 'electrician', 'plumber', 'society_office', 'other')),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'visitor', 'complaint', 'notice', 'bill', 'emergency', 'staff')),
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VEHICLE REGISTRY
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('car', 'bike', 'scooter', 'bicycle', 'other')),
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    parking_slot VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_society ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_visitors_society ON visitors(society_id);
CREATE INDEX IF NOT EXISTS idx_visitors_resident ON visitors(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_complaints_society ON complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_notices_society ON notices(society_id);
CREATE INDEX IF NOT EXISTS idx_bills_resident ON bills(resident_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_staff_society ON staff(society_id);
CREATE INDEX IF NOT EXISTS idx_amenity_bookings_date ON amenity_bookings(booking_date);
