-- MySQL 8.x  |  utf8mb4
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(190)    NOT NULL,
  display_name    VARCHAR(60)     NOT NULL,
  password_hash   VARCHAR(100)    NOT NULL,
  age_group       ENUM('20-29','30-39','40-49','50-60') NOT NULL,
  role            ENUM('player','admin') NOT NULL DEFAULT 'player',
  consent_at      DATETIME        NOT NULL,           -- PDPA: เวลาที่ผู้ใช้ยินยอม
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS levels (
  id            TINYINT UNSIGNED NOT NULL,            -- 1..5 (เรียงตามลำดับด่าน)
  title         VARCHAR(120)     NOT NULL,
  description   VARCHAR(500)     NOT NULL,
  max_score     INT UNSIGNED     NOT NULL DEFAULT 100,
  min_time_sec  INT UNSIGNED     NOT NULL DEFAULT 20, -- กันส่งคะแนนปลอมที่เร็วเกินจริง
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ผลการเล่นทุกครั้ง (ใช้วิเคราะห์สถิติ)
CREATE TABLE IF NOT EXISTS game_sessions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  level_id       TINYINT UNSIGNED NOT NULL,
  score          INT UNSIGNED    NOT NULL,
  stars          TINYINT UNSIGNED NOT NULL,
  time_spent_sec INT UNSIGNED    NOT NULL,
  passed         TINYINT(1)      NOT NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sessions_user (user_id, level_id),
  KEY idx_sessions_level (level_id, created_at),
  CONSTRAINT fk_sessions_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_sessions_level FOREIGN KEY (level_id) REFERENCES levels(id)
) ENGINE=InnoDB;

-- สถานะ/คะแนนดีที่สุดต่อผู้เล่นต่อด่าน
CREATE TABLE IF NOT EXISTS level_progress (
  user_id            BIGINT UNSIGNED  NOT NULL,
  level_id           TINYINT UNSIGNED NOT NULL,
  best_score         INT UNSIGNED     NOT NULL DEFAULT 0,
  best_stars         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  best_time_sec      INT UNSIGNED     NULL,
  attempts           INT UNSIGNED     NOT NULL DEFAULT 0,
  completed          TINYINT(1)       NOT NULL DEFAULT 0,
  first_completed_at DATETIME         NULL,
  updated_at         DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, level_id),
  KEY idx_progress_level (level_id),
  CONSTRAINT fk_progress_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_level FOREIGN KEY (level_id) REFERENCES levels(id)
) ENGINE=InnoDB;

-- การตัดสินใจรายข้อในเกม roleplay (หาว่าคนพลาดจุดไหนบ่อย)
CREATE TABLE IF NOT EXISTS decisions_log (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id  BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  level_id    TINYINT UNSIGNED NOT NULL,
  choice_key  VARCHAR(64)     NOT NULL,
  is_correct  TINYINT(1)      NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_decisions_choice (level_id, choice_key),
  CONSTRAINT fk_decisions_session FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_decisions_user    FOREIGN KEY (user_id)    REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB;

-- คลังข้อสอบ  (level_id = NULL คือข้อสอบรวมสำหรับ pre/post test)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  level_id      TINYINT UNSIGNED NULL,
  question      VARCHAR(500) NOT NULL,
  choices       JSON         NOT NULL,
  correct_index TINYINT UNSIGNED NOT NULL,
  explanation   VARCHAR(800) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_quiz_level (level_id, is_active),
  CONSTRAINT fk_quiz_level FOREIGN KEY (level_id) REFERENCES levels(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quiz_results (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  level_id    TINYINT UNSIGNED NULL,
  type        ENUM('pre','post','level') NOT NULL,
  score       SMALLINT UNSIGNED NOT NULL,
  total       SMALLINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qresult_user (user_id, type),
  CONSTRAINT fk_qresult_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- อันดับรวม: คะแนนดีที่สุดของทุกด่านรวมกัน, เสมอกันดูเวลารวมที่น้อยกว่า
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT u.id AS user_id,
       u.display_name,
       SUM(p.best_score)         AS total_score,
       SUM(p.best_stars)         AS total_stars,
       SUM(p.completed)          AS levels_completed,
       COALESCE(SUM(p.best_time_sec), 0) AS total_time_sec
FROM users u
JOIN level_progress p ON p.user_id = u.id
WHERE u.role = 'player'
GROUP BY u.id, u.display_name;
