-- Local development data only. Rerunning this file refreshes the same 40 records.
WITH seed(n, name, nationality_code, time_zone) AS (
  VALUES
    (1, 'Sofía Martínez', 'AR', 'America/Argentina/Buenos_Aires'),
    (2, 'Lucas Pereira', 'BR', 'America/Sao_Paulo'),
    (3, 'Emma Johnson', 'US', 'America/New_York'),
    (4, 'Noah Williams', 'GB', 'Europe/London'),
    (5, 'Olivia Brown', 'CA', 'America/Toronto'),
    (6, 'Mateo García', 'MX', 'America/Mexico_City'),
    (7, 'Isabella Rossi', 'IT', 'Europe/Rome'),
    (8, 'Liam O''Connor', 'IE', 'Europe/Dublin'),
    (9, 'Camila Rojas', 'CL', 'America/Santiago'),
    (10, 'Ethan Miller', 'AU', 'Australia/Sydney'),
    (11, 'Valentina Gómez', 'CO', 'America/Bogota'),
    (12, 'James Wilson', 'NZ', 'Pacific/Auckland'),
    (13, 'Mia Schneider', 'DE', 'Europe/Berlin'),
    (14, 'Benjamín Silva', 'UY', 'America/Montevideo'),
    (15, 'Amelia Taylor', 'US', 'America/Los_Angeles'),
    (16, 'Thiago Santos', 'BR', 'America/Recife'),
    (17, 'Charlotte Martin', 'FR', 'Europe/Paris'),
    (18, 'Samuel López', 'ES', 'Europe/Madrid'),
    (19, 'Harper Davis', 'CA', 'America/Vancouver'),
    (20, 'Nicolás Fernández', 'AR', 'America/Argentina/Cordoba'),
    (21, 'Ava Thompson', 'GB', 'Europe/London'),
    (22, 'Gabriel Costa', 'PT', 'Europe/Lisbon'),
    (23, 'Luna Morales', 'PE', 'America/Lima'),
    (24, 'Henry Anderson', 'US', 'America/Chicago'),
    (25, 'Giulia Romano', 'IT', 'Europe/Milan'),
    (26, 'Daniel Kim', 'KR', 'Asia/Seoul'),
    (27, 'Victoria Herrera', 'EC', 'America/Guayaquil'),
    (28, 'Alexander Smith', 'AU', 'Australia/Melbourne'),
    (29, 'Martina Bianchi', 'CH', 'Europe/Zurich'),
    (30, 'Leo Dubois', 'BE', 'Europe/Brussels'),
    (31, 'Emilia Vargas', 'CR', 'America/Costa_Rica'),
    (32, 'Oscar Jensen', 'DK', 'Europe/Copenhagen'),
    (33, 'Zoe Campbell', 'NZ', 'Pacific/Auckland'),
    (34, 'Tomás Núñez', 'PY', 'America/Asuncion'),
    (35, 'Grace Walker', 'US', 'America/Denver'),
    (36, 'Rafael Oliveira', 'BR', 'America/Sao_Paulo'),
    (37, 'Chloe Evans', 'GB', 'Europe/London'),
    (38, 'Joaquín Castro', 'BO', 'America/La_Paz'),
    (39, 'Ella Murphy', 'IE', 'Europe/Dublin'),
    (40, 'Felipe Méndez', 'PA', 'America/Panama')
)
INSERT INTO student (
  id,
  teacher_id,
  name,
  normalized_name,
  email,
  phone,
  nationality_code,
  time_zone,
  preferred_contact_channel,
  contact_details,
  level,
  preferences,
  interests,
  learning_goals,
  source,
  hourly_rate_minor,
  is_active,
  avatar_key,
  theme_color,
  deleted_at,
  created_at,
  updated_at
)
SELECT
  printf('local-seed-student-%02d', n),
  (SELECT id FROM user WHERE lower(email) = 'gonza94.4@gmail.com' LIMIT 1),
  name,
  lower(name),
  printf('local.student.%02d@example.test', n),
  CASE WHEN n % 4 = 0 THEN NULL ELSE printf('+1-555-01%02d', n) END,
  nationality_code,
  time_zone,
  CASE n % 6
    WHEN 0 THEN 'email'
    WHEN 1 THEN 'phone'
    WHEN 2 THEN 'whatsapp'
    WHEN 3 THEN 'telegram'
    WHEN 4 THEN 'zoom'
    ELSE 'other'
  END,
  CASE WHEN n % 3 = 0 THEN 'Usually available after 17:00 local time.' ELSE NULL END,
  CASE n % 6
    WHEN 1 THEN 'A1'
    WHEN 2 THEN 'A2'
    WHEN 3 THEN 'B1'
    WHEN 4 THEN 'B2'
    WHEN 5 THEN 'C1'
    ELSE 'C2'
  END,
  CASE n % 3
    WHEN 0 THEN '[{"type":"builtin","key":"visualMaterials"}]'
    WHEN 1 THEN '[{"type":"builtin","key":"conversationLed"}]'
    ELSE '[{"type":"builtin","key":"structuredPractice"}]'
  END,
  CASE n % 4
    WHEN 0 THEN '[{"type":"builtin","key":"travel"}]'
    WHEN 1 THEN '[{"type":"builtin","key":"music"}]'
    WHEN 2 THEN '[{"type":"builtin","key":"technology"}]'
    ELSE '[{"type":"builtin","key":"film"}]'
  END,
  CASE n % 4
    WHEN 0 THEN 'Prepare for an upcoming proficiency exam.'
    WHEN 1 THEN 'Speak confidently during travel and everyday conversations.'
    WHEN 2 THEN 'Improve professional writing and meeting vocabulary.'
    ELSE 'Build fluency, pronunciation, and listening comprehension.'
  END,
  CASE WHEN n <= 20 THEN 'preply' ELSE 'private' END,
  1500 + (n * 125),
  CASE
    WHEN n BETWEEN 1 AND 14 THEN 1
    WHEN n BETWEEN 21 AND 33 THEN 1
    ELSE 0
  END,
  printf('avatar-%02d', ((n - 1) % 32) + 1),
  CASE n % 6
    WHEN 0 THEN 'coral'
    WHEN 1 THEN 'gold'
    WHEN 2 THEN 'mint'
    WHEN 3 THEN 'sky'
    WHEN 4 THEN 'violet'
    ELSE 'rose'
  END,
  NULL,
  unixepoch(datetime('2026-06-01', printf('+%d days', n))) * 1000,
  unixepoch(datetime('2026-07-01', printf('+%d hours', n))) * 1000
FROM seed
WHERE true
ON CONFLICT(id) DO UPDATE SET
  teacher_id = excluded.teacher_id,
  name = excluded.name,
  normalized_name = excluded.normalized_name,
  email = excluded.email,
  phone = excluded.phone,
  nationality_code = excluded.nationality_code,
  time_zone = excluded.time_zone,
  preferred_contact_channel = excluded.preferred_contact_channel,
  contact_details = excluded.contact_details,
  level = excluded.level,
  preferences = excluded.preferences,
  interests = excluded.interests,
  learning_goals = excluded.learning_goals,
  source = excluded.source,
  hourly_rate_minor = excluded.hourly_rate_minor,
  is_active = excluded.is_active,
  avatar_key = excluded.avatar_key,
  theme_color = excluded.theme_color,
  deleted_at = excluded.deleted_at,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;
