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
  year VARCHAR(20),
  semester VARCHAR(20),
  section VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  subject_code VARCHAR(50) NOT NULL UNIQUE,
  branch VARCHAR(80) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  import_batch_id VARCHAR(80),
  imported_at DATETIME,
  CONSTRAINT uk_subject_name_branch_semester UNIQUE (name, branch, semester)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT NOT NULL,
  session_date DATE NOT NULL,
  exam_subject VARCHAR(255),
  exam_year VARCHAR(255),
  exam_semester VARCHAR(255),
  exam_branch VARCHAR(255),
  exam_section VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_session_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT uk_session_teacher_date_subject_class UNIQUE (
    teacher_id,
    session_date,
    exam_subject,
    exam_year,
    exam_semester,
    exam_branch,
    exam_section
  )
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

CREATE TABLE IF NOT EXISTS attendance_session_roster_snapshots (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  scholar_number VARCHAR(50) NOT NULL,
  enrollment_number VARCHAR(50),
  student_name VARCHAR(120) NOT NULL,
  exam_year VARCHAR(20),
  exam_semester VARCHAR(20),
  exam_branch VARCHAR(120),
  exam_section VARCHAR(20),
  captured_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_roster_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
  CONSTRAINT fk_roster_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT uk_session_roster_scholar UNIQUE (session_id, scholar_number),
  INDEX idx_roster_session (session_id),
  INDEX idx_roster_scholar (scholar_number),
  INDEX idx_roster_student (student_id)
);

CREATE TABLE IF NOT EXISTS attendance_adjustments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  adjusted_by VARCHAR(80) NOT NULL,
  adjusted_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_adjustment_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
  CONSTRAINT fk_adjustment_student FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_adjustment_session_student (session_id, student_id),
  INDEX idx_adjustment_session_time (session_id, adjusted_at)
);

CREATE TABLE IF NOT EXISTS student_promotion_batches (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  from_year VARCHAR(20) NOT NULL,
  from_semester VARCHAR(20) NOT NULL,
  from_branch VARCHAR(120) NOT NULL,
  from_section VARCHAR(20) NOT NULL,
  to_year VARCHAR(20) NOT NULL,
  to_semester VARCHAR(20) NOT NULL,
  to_branch VARCHAR(120) NOT NULL,
  to_section VARCHAR(20) NOT NULL,
  promoted_by VARCHAR(80) NOT NULL,
  promoted_at TIMESTAMP NOT NULL,
  status VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS student_promotion_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  from_year VARCHAR(20) NOT NULL,
  from_semester VARCHAR(20) NOT NULL,
  from_branch VARCHAR(120) NOT NULL,
  from_section VARCHAR(20) NOT NULL,
  to_year VARCHAR(20) NOT NULL,
  to_semester VARCHAR(20) NOT NULL,
  to_branch VARCHAR(120) NOT NULL,
  to_section VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  reason VARCHAR(255),
  CONSTRAINT fk_promotion_item_batch FOREIGN KEY (batch_id) REFERENCES student_promotion_batches(id),
  CONSTRAINT fk_promotion_item_student FOREIGN KEY (student_id) REFERENCES students(id)
);
