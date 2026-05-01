-- ultraGrade initial schema
-- Run this in the Supabase SQL editor: Dashboard → SQL Editor → New query

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  (extends auth.users — stores all Settings data)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme               TEXT        NOT NULL DEFAULT 'ultragrade-dark',
  active_semester_id  TEXT,
  gpa_scale           TEXT        NOT NULL DEFAULT 'standard-4.0',
  grade_display       TEXT        NOT NULL DEFAULT 'percentage',
  week_starts_on      INT         NOT NULL DEFAULT 1,
  student_type        TEXT,
  school              TEXT        NOT NULL DEFAULT '',
  permit_expiry_date  DATE,
  student_name        TEXT        NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- semesters
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semesters (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  start_date  TEXT        NOT NULL DEFAULT '',
  end_date    TEXT        NOT NULL DEFAULT '',
  is_active   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- courses
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id                   TEXT        PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_id          TEXT        NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  code                 TEXT        NOT NULL DEFAULT '',
  name                 TEXT        NOT NULL DEFAULT '',
  professor            TEXT        NOT NULL DEFAULT '',
  credit_hours         NUMERIC(5,2) NOT NULL DEFAULT 3,
  target_grade         NUMERIC(5,2) NOT NULL DEFAULT 70,
  color                TEXT        NOT NULL DEFAULT '#818cf8',
  notes                TEXT        NOT NULL DEFAULT '',
  outline_uploaded     BOOLEAN     NOT NULL DEFAULT false,
  final_grade_override NUMERIC(5,2),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- categories  (was nested inside courses[] in localStorage)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  weight      NUMERIC(6,2) NOT NULL DEFAULT 0,
  drop_lowest BOOLEAN     NOT NULL DEFAULT false,
  position    INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- grades  (was nested inside categories[] in localStorage)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL DEFAULT '',
  score       NUMERIC(8,2) NOT NULL DEFAULT 0,
  max_score   NUMERIC(8,2) NOT NULL DEFAULT 100,
  weight      NUMERIC(6,2) NOT NULL DEFAULT 1,
  date        TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- timetable_entries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_entries (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_id TEXT        NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  course_id   TEXT        REFERENCES courses(id) ON DELETE SET NULL,
  label       TEXT        NOT NULL DEFAULT '',
  location    TEXT        NOT NULL DEFAULT '',
  professor   TEXT        NOT NULL DEFAULT '',
  day_of_week INT         NOT NULL DEFAULT 1,
  start_time  TEXT        NOT NULL DEFAULT '09:00',
  end_time    TEXT        NOT NULL DEFAULT '10:00',
  color       TEXT        NOT NULL DEFAULT '#818cf8',
  type        TEXT        NOT NULL DEFAULT 'lecture',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_id   TEXT        NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  course_id     TEXT        REFERENCES courses(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL DEFAULT '',
  type          TEXT        NOT NULL DEFAULT 'assignment',
  due_date      TEXT        NOT NULL DEFAULT '',
  due_time      TEXT        NOT NULL DEFAULT '23:59',
  description   TEXT        NOT NULL DEFAULT '',
  completed     BOOLEAN     NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  priority      TEXT        NOT NULL DEFAULT 'medium',
  reminder_days INT         NOT NULL DEFAULT 3,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- study_hours  (composite PK — upserted by course)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_hours (
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     TEXT        NOT NULL,
  total_seconds INT         NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_hours       ENABLE ROW LEVEL SECURITY;

-- profiles: keyed by id (not user_id)
CREATE POLICY "profiles: own row" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- all other tables: keyed by user_id
CREATE POLICY "semesters: own rows" ON semesters
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses: own rows" ON courses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories: own rows" ON categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "grades: own rows" ON grades
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timetable_entries: own rows" ON timetable_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: own rows" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_hours: own rows" ON study_hours
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create profile row when a new user signs up
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
