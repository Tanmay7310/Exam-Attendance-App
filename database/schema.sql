CREATE DATABASE IF NOT EXISTS exam_attendance;
USE exam_attendance;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  enabled BIT NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  teacher_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  subject VARCHAR(120) NOT NULL,
  user_id BIGINT NOT NULL UNIQUE,
  CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS students (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scholar_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  enrollment_number VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(120) NOT NULL,
  section VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT NOT NULL,
  session_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_session_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT uk_session_teacher_date UNIQUE (teacher_id, session_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  scanned_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_record_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
  CONSTRAINT fk_record_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT uk_session_student UNIQUE (session_id, student_id)
);
