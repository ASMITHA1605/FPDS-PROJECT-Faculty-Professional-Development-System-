-- FPDS Local Database Setup
CREATE DATABASE IF NOT EXISTS fpds_db;
USE fpds_db;

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100),
    password VARCHAR(100),
    experience_years INT DEFAULT 0
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_name VARCHAR(100),
    activity_type VARCHAR(50),
    title VARCHAR(200),
    date DATE,
    organizer VARCHAR(100),
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING'
);

-- Seed admin user (skip if already exists)
INSERT IGNORE INTO faculty (name, department, password, experience_years)
VALUES ('admin', 'Administration', 'admin123', 0);

-- Seed sample faculty
INSERT IGNORE INTO faculty (name, department, password, experience_years) VALUES
('Dr. Ravi Kumar', 'CSE', 'faculty123', 10),
('Dr. Priya Sharma', 'ECE', 'faculty123', 8),
('Prof. Suresh Babu', 'MECH', 'faculty123', 15);

-- Seed sample activities
INSERT INTO activities (faculty_name, activity_type, title, date, organizer, department, semester, academic_year, status) VALUES
('Dr. Ravi Kumar', 'Workshop', 'Modern Web Design', '2024-03-10', 'Google', 'CSE', 'Even', '2023-24', 'APPROVED'),
('Dr. Ravi Kumar', 'Conference', 'AI in Education', '2024-03-11', 'IEEE', 'CSE', 'Even', '2023-24', 'APPROVED'),
('Dr. Ravi Kumar', 'FDP', 'Full Stack Development', '2024-03-12', 'NIELIT', 'CSE', 'Even', '2023-24', 'APPROVED'),
('Dr. Priya Sharma', 'Workshop', 'VLSI Design Trends', '2024-04-05', 'IETE', 'ECE', 'Even', '2023-24', 'APPROVED'),
('Dr. Priya Sharma', 'Publication', 'IoT Security Research', '2024-02-20', 'Springer', 'ECE', 'Odd', '2023-24', 'APPROVED'),
('Prof. Suresh Babu', 'FDP', 'Advanced Manufacturing', '2024-01-15', 'AICTE', 'MECH', 'Odd', '2023-24', 'APPROVED');

SELECT 'FPDS Database setup complete!' as Result;
SELECT COUNT(*) as Faculty_Count FROM faculty;
SELECT COUNT(*) as Activity_Count FROM activities;
