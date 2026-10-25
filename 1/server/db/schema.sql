-- EventTech: схема базы данных PostgreSQL.
-- Можно выполнить в pgAdmin 4 (Query Tool) или командой `npm run db:init`.
-- Скрипт пересоздаёт все таблицы — существующие данные будут удалены.

DROP TABLE IF EXISTS guests, budget_items, tasks, team_members, events, users CASCADE;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  position      TEXT        NOT NULL DEFAULT 'Организатор',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id                 SERIAL PRIMARY KEY,
  owner_id           INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              TEXT          NOT NULL,
  type               TEXT          NOT NULL DEFAULT 'conference'
                     CHECK (type IN ('conference', 'forum', 'exhibition', 'festival', 'corporate', 'training', 'hackathon', 'meetup', 'other')),
  status             TEXT          NOT NULL DEFAULT 'preparing'
                     CHECK (status IN ('draft', 'preparing', 'live', 'finished', 'cancelled')),
  start_date         DATE          NOT NULL,
  end_date           DATE          NOT NULL,
  start_time         TIME,
  location           TEXT          NOT NULL DEFAULT '',
  description        TEXT          NOT NULL DEFAULT '',
  expected_attendees INTEGER       NOT NULL DEFAULT 0 CHECK (expected_attendees >= 0),
  budget_limit       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budget_limit >= 0),
  registration_open  BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Команда мероприятия. user_id заполнен, если участник команды зарегистрирован в сервисе.
CREATE TABLE team_members (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL DEFAULT '',
  role       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX team_members_event_idx ON team_members(event_id);
CREATE INDEX team_members_user_idx  ON team_members(user_id);

CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  assignee_id INTEGER     REFERENCES team_members(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  due_date    DATE,
  priority    TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status      TEXT        NOT NULL DEFAULT 'todo'   CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tasks_event_idx ON tasks(event_id);

CREATE TABLE budget_items (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category   TEXT          NOT NULL,
  title      TEXT          NOT NULL,
  vendor     TEXT          NOT NULL DEFAULT '',
  planned    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (planned >= 0),
  actual     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (actual >= 0),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX budget_items_event_idx ON budget_items(event_id);

CREATE TABLE guests (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT        NOT NULL DEFAULT '',
  company    TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'registered'
             CHECK (status IN ('registered', 'confirmed', 'checked_in', 'cancelled')),
  source     TEXT        NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'form')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);
CREATE INDEX guests_event_idx ON guests(event_id);
