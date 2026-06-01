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
