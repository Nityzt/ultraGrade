-- Production metadata and basic integrity checks. Run after migrations 001/002.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_consent_version TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE grades ADD CONSTRAINT grades_max_score_positive CHECK (max_score > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE grades ADD CONSTRAINT grades_score_nonnegative CHECK (score >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE courses ADD CONSTRAINT courses_credit_hours_nonnegative CHECK (credit_hours >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_weight_bounded CHECK (weight >= 0 AND weight <= 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS semesters_user_created_idx ON semesters(user_id, created_at);
CREATE INDEX IF NOT EXISTS courses_user_semester_idx ON courses(user_id, semester_id);
CREATE INDEX IF NOT EXISTS tasks_user_due_date_idx ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS timetable_user_day_idx ON timetable_entries(user_id, semester_id, day_of_week);

-- RLS protects rows returned to a user, but foreign keys alone would still
-- allow a malicious client to reference another user's parent row. Reject
-- cross-account references at the database boundary as well.
CREATE OR REPLACE FUNCTION public.validate_ultragrade_ownership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE owner_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'courses' THEN
    SELECT user_id INTO owner_id FROM semesters WHERE id = NEW.semester_id;
  ELSIF TG_TABLE_NAME = 'categories' THEN
    SELECT user_id INTO owner_id FROM courses WHERE id = NEW.course_id;
  ELSIF TG_TABLE_NAME = 'grades' THEN
    SELECT user_id INTO owner_id FROM categories WHERE id = NEW.category_id;
  ELSIF TG_TABLE_NAME IN ('tasks', 'timetable_entries') THEN
    SELECT user_id INTO owner_id FROM semesters WHERE id = NEW.semester_id;
    IF owner_id IS NULL OR owner_id <> NEW.user_id THEN
      RAISE EXCEPTION 'Referenced semester belongs to another account';
    END IF;
    IF NEW.course_id IS NULL THEN RETURN NEW; END IF;
    SELECT user_id INTO owner_id FROM courses WHERE id = NEW.course_id;
  ELSE
    RETURN NEW;
  END IF;
  IF owner_id IS NULL OR owner_id <> NEW.user_id THEN
    RAISE EXCEPTION 'Referenced academic record belongs to another account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_owner_guard ON courses;
CREATE TRIGGER courses_owner_guard BEFORE INSERT OR UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION public.validate_ultragrade_ownership();
DROP TRIGGER IF EXISTS categories_owner_guard ON categories;
CREATE TRIGGER categories_owner_guard BEFORE INSERT OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION public.validate_ultragrade_ownership();
DROP TRIGGER IF EXISTS grades_owner_guard ON grades;
CREATE TRIGGER grades_owner_guard BEFORE INSERT OR UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION public.validate_ultragrade_ownership();
DROP TRIGGER IF EXISTS tasks_owner_guard ON tasks;
CREATE TRIGGER tasks_owner_guard BEFORE INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION public.validate_ultragrade_ownership();
DROP TRIGGER IF EXISTS timetable_owner_guard ON timetable_entries;
CREATE TRIGGER timetable_owner_guard BEFORE INSERT OR UPDATE ON timetable_entries FOR EACH ROW EXECUTE FUNCTION public.validate_ultragrade_ownership();
