-- EventTech: демо-данные (как в макете). Выполнять сразу после schema.sql.
-- Даты считаются от текущего дня, поэтому демо всегда выглядит актуальным.
-- Вход для демо: anna@eventtech.ru / demo123

INSERT INTO users (id, name, email, password_hash, position) VALUES
  (1, 'Анна Петрова', 'anna@eventtech.ru', '$2b$10$O92NHSPUNm/I.9QilN/uwOtd9l78U41VTh9cGnBiMuHofvx/iKlyy', 'Организатор');
SELECT setval('users_id_seq', (SELECT max(id) FROM users));

INSERT INTO events (id, owner_id, title, type, status, start_date, end_date, start_time, location, description, expected_attendees, budget_limit) VALUES
  (1, 1, 'Бизнес-форум «Технологии будущего»', 'forum', 'preparing',
   CURRENT_DATE + 30, CURRENT_DATE + 31, '10:00', 'Москва, Крокус Экспо',
   'Обсудить тренды и перспективы развития технологий в бизнесе. Пленарная сессия, 4 тематических трека, нетворкинг и выставка решений.',
   500, 1500000),
  (2, 1, 'Внутренний хакатон «AI для HR»', 'hackathon', 'draft',
   CURRENT_DATE + 60, CURRENT_DATE + 61, '09:00', 'Москва, офис на Тверской',
   'Двухдневный хакатон для сотрудников: прототипы AI-инструментов для HR-процессов.',
   80, 300000);
SELECT setval('events_id_seq', (SELECT max(id) FROM events));

INSERT INTO team_members (id, event_id, user_id, name, email, role) VALUES
  (1, 1, 1,    'Анна Петрова',   'anna@eventtech.ru',  'Руководитель проекта'),
  (2, 1, NULL, 'Иван Смирнов',   'ivan@eventtech.ru',  'Менеджер площадки'),
  (3, 1, NULL, 'Мария Козлова',  'maria@eventtech.ru', 'Программный директор'),
  (4, 1, NULL, 'Дмитрий Орлов',  'dmitry@eventtech.ru','Маркетинг'),
  (5, 1, NULL, 'Елена Волкова',  'elena@eventtech.ru', 'Работа с участниками'),
  (6, 2, 1,    'Анна Петрова',   'anna@eventtech.ru',  'Руководитель проекта');
SELECT setval('team_members_id_seq', (SELECT max(id) FROM team_members));

-- 12 открытых задач (2 просрочены)
INSERT INTO tasks (event_id, assignee_id, title, due_date, priority, status) VALUES
  (1, 2, 'Подписать договор с площадкой',          CURRENT_DATE + 1,  'high',   'in_progress'),
  (1, 3, 'Согласовать программу со спикерами',     CURRENT_DATE + 3,  'medium', 'in_progress'),
  (1, 4, 'Запустить рассылку приглашений',         CURRENT_DATE + 6,  'medium', 'todo'),
  (1, 5, 'Подготовить раздаточные материалы',      CURRENT_DATE + 10, 'low',    'todo'),
  (1, 1, 'Утвердить меню кейтеринга',              CURRENT_DATE - 2,  'high',   'todo'),
  (1, 5, 'Заказать бейджи и ленты',                CURRENT_DATE - 1,  'medium', 'todo'),
  (1, 4, 'Настроить трансляцию в соцсетях',        CURRENT_DATE + 14, 'medium', 'todo'),
  (1, 1, 'Подготовить презентацию открытия',       CURRENT_DATE + 18, 'medium', 'todo'),
  (1, 2, 'Организовать трансфер для спикеров',     CURRENT_DATE + 20, 'medium', 'todo'),
  (1, 5, 'Подготовить анкету обратной связи',      CURRENT_DATE + 25, 'low',    'todo'),
  (1, 3, 'Провести репетицию с ведущим',           CURRENT_DATE + 27, 'high',   'todo'),
  (1, 2, 'Проверить техническое оснащение зала',   CURRENT_DATE + 28, 'high',   'todo');

-- 24 выполненные задачи
INSERT INTO tasks (event_id, assignee_id, title, due_date, priority, status) VALUES
  (1, 1, 'Определить концепцию форума',            CURRENT_DATE - 60, 'high',   'done'),
  (1, 1, 'Утвердить бюджет мероприятия',           CURRENT_DATE - 58, 'high',   'done'),
  (1, 2, 'Выбрать площадку',                       CURRENT_DATE - 55, 'high',   'done'),
  (1, 3, 'Сформировать список спикеров',           CURRENT_DATE - 52, 'high',   'done'),
  (1, 3, 'Разослать приглашения спикерам',         CURRENT_DATE - 50, 'medium', 'done'),
  (1, 4, 'Создать лендинг мероприятия',            CURRENT_DATE - 48, 'medium', 'done'),
  (1, 5, 'Открыть регистрацию участников',         CURRENT_DATE - 46, 'high',   'done'),
  (1, 4, 'Согласовать дизайн айдентики',           CURRENT_DATE - 45, 'medium', 'done'),
  (1, 2, 'Заключить договор с кейтерингом',        CURRENT_DATE - 42, 'medium', 'done'),
  (1, 2, 'Выбрать подрядчика по звуку и свету',    CURRENT_DATE - 40, 'medium', 'done'),
  (1, 4, 'Подготовить пресс-релиз',                CURRENT_DATE - 38, 'low',    'done'),
  (1, 4, 'Договориться с информационными партнёрами', CURRENT_DATE - 36, 'low', 'done'),
  (1, 4, 'Запустить таргетированную рекламу',      CURRENT_DATE - 34, 'medium', 'done'),
  (1, 2, 'Забронировать гостиницу для спикеров',   CURRENT_DATE - 30, 'medium', 'done'),
  (1, 2, 'Утвердить план рассадки',                CURRENT_DATE - 28, 'low',    'done'),
  (1, 5, 'Заказать сувенирную продукцию',          CURRENT_DATE - 25, 'low',    'done'),
  (1, 3, 'Согласовать тайминг программы',          CURRENT_DATE - 22, 'high',   'done'),
  (1, 3, 'Подготовить договоры со спикерами',      CURRENT_DATE - 20, 'medium', 'done'),
  (1, 5, 'Набрать волонтёров',                     CURRENT_DATE - 18, 'medium', 'done'),
  (1, 1, 'Оформить страховку мероприятия',         CURRENT_DATE - 15, 'low',    'done'),
  (1, 2, 'Согласовать охрану площадки',            CURRENT_DATE - 12, 'medium', 'done'),
  (1, 5, 'Подготовить шаблоны писем участникам',   CURRENT_DATE - 10, 'low',    'done'),
  (1, 5, 'Настроить чек-ин по QR-кодам',           CURRENT_DATE - 7,  'medium', 'done'),
  (1, 5, 'Провести брифинг волонтёров',            CURRENT_DATE - 4,  'low',    'done');

-- Задачи хакатона
INSERT INTO tasks (event_id, assignee_id, title, due_date, priority, status) VALUES
  (2, 6, 'Сформулировать кейсы для команд',        CURRENT_DATE + 10, 'high',   'todo'),
  (2, 6, 'Собрать жюри',                           CURRENT_DATE + 20, 'medium', 'todo');

-- Бюджет: план 1 450 000 ₽, факт 1 250 000 ₽ из лимита 1 500 000 ₽
INSERT INTO budget_items (event_id, category, title, vendor, planned, actual) VALUES
  (1, 'Площадка',   'Аренда зала и фойе',          'Крокус Экспо',  500000, 500000),
  (1, 'Кейтеринг',  'Кофе-брейки и обед',          'Вкусный день',  300000, 250000),
  (1, 'Техника',    'Звук, свет и LED-экраны',     'ПроСаунд',      250000, 230000),
  (1, 'Маркетинг',  'Таргетированная реклама',     'Digital Pro',   120000, 110000),
  (1, 'Спикеры',    'Гонорары и проезд спикеров',  '',              150000, 100000),
  (1, 'Печать',     'Бейджи, баннеры, раздатка',   'ПринтМастер',    60000,  40000),
  (1, 'Персонал',   'Ведущий и волонтёры',         '',               70000,  20000),
  (2, 'Кейтеринг',  'Питание участников',          '',              150000,      0);

-- Гости: 342 активные регистрации + 6 отменённых
INSERT INTO guests (event_id, name, email, phone, company, status, source, created_at)
SELECT
  1,
  CASE WHEN g % 2 = 0
    THEN (ARRAY['Алексей','Сергей','Андрей','Дмитрий','Михаил','Николай','Павел','Артём','Егор','Кирилл'])[1 + (g / 2) % 10]
         || ' ' ||
         (ARRAY['Иванов','Смирнов','Кузнецов','Попов','Соколов','Лебедев','Новиков','Морозов','Фёдоров','Волков','Зайцев','Белов'])[1 + (g / 20) % 12]
    ELSE (ARRAY['Анна','Мария','Екатерина','Ольга','Наталья','Татьяна','Юлия','Ирина','Дарья','Светлана'])[1 + (g / 2) % 10]
         || ' ' ||
         (ARRAY['Иванова','Смирнова','Кузнецова','Попова','Соколова','Лебедева','Новикова','Морозова','Фёдорова','Волкова','Зайцева','Белова'])[1 + (g / 20) % 12]
  END,
  'guest' || g || '@example.com',
  '+7 900 ' || lpad(g::text, 3, '0') || '-' || lpad(((g * 37) % 100)::text, 2, '0') || '-' || lpad(((g * 53) % 100)::text, 2, '0'),
  (ARRAY['Сбер','Яндекс','МТС','Ростелеком','VK','Тинькофф','Газпром нефть','Росатом','Лаборатория Касперского','Ozon','Wildberries','Х5 Group'])[1 + g % 12],
  CASE WHEN g <= 6 THEN 'cancelled' WHEN g % 5 = 0 THEN 'confirmed' ELSE 'registered' END,
  CASE WHEN g % 4 = 0 THEN 'manual' ELSE 'form' END,
  now() - ((348 - g) * interval '3 hours')
FROM generate_series(1, 348) AS g;
