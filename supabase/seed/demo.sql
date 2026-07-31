-- ═══════════════════════════════════════════════════════════════════════════
-- NoblecleanOps — Demo-Seed-Daten
-- Ausführen: Supabase SQL-Editor (Role: postgres)
-- ───────────────────────────────────────────────────────────────────────────
-- Klient    : John Reed Fitness München  +  SportCity Hamburg
-- Zeitraum  : 2026-01-15 → 2026-07-30  (6,5 Monate)
-- Mitarbeiter: 4  |  Sektionen: 28  |  Aufgaben: 86
-- Pläne     : ~540  |  Plan-Items: ~7.500
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 1 — Auth-Benutzer (4 Demo-Mitarbeiter)
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin
) VALUES
  ('a0a00000-0000-4000-8000-000000000000',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'admin@nobleclean.de',
   crypt('Demo@2026!', gen_salt('bf')),
   '2026-01-10 08:00:00+00',
   '{"provider":"email","providers":["email"]}', '{}',
   '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00', true),

  ('e1a00000-0001-4000-8001-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'thomas.mueller@demo.nobleclean.de',
   crypt('Demo@2026!', gen_salt('bf')),
   '2026-01-10 08:00:00+00',
   '{"provider":"email","providers":["email"]}', '{}',
   '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00', false),

  ('e2a00000-0002-4000-8002-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'stefan.schmidt@demo.nobleclean.de',
   crypt('Demo@2026!', gen_salt('bf')),
   '2026-01-10 08:00:00+00',
   '{"provider":"email","providers":["email"]}', '{}',
   '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00', false),

  ('e3a00000-0003-4000-8003-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'marcel.braun@demo.nobleclean.de',
   crypt('Demo@2026!', gen_salt('bf')),
   '2026-01-10 08:00:00+00',
   '{"provider":"email","providers":["email"]}', '{}',
   '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00', false),

  ('e4a00000-0004-4000-8004-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'lisa.weber@demo.nobleclean.de',
   crypt('Demo@2026!', gen_salt('bf')),
   '2026-01-10 08:00:00+00',
   '{"provider":"email","providers":["email"]}', '{}',
   '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES
  (gen_random_uuid(), 'admin@nobleclean.de',
   'a0a00000-0000-4000-8000-000000000000',
   '{"sub":"a0a00000-0000-4000-8000-000000000000","email":"admin@nobleclean.de","email_verified":true}',
   'email', '2026-01-15 07:00:00+00', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  (gen_random_uuid(), 'thomas.mueller@demo.nobleclean.de',
   'e1a00000-0001-4000-8001-000000000001',
   '{"sub":"e1a00000-0001-4000-8001-000000000001","email":"thomas.mueller@demo.nobleclean.de","email_verified":true}',
   'email', '2026-01-15 07:00:00+00', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  (gen_random_uuid(), 'stefan.schmidt@demo.nobleclean.de',
   'e2a00000-0002-4000-8002-000000000002',
   '{"sub":"e2a00000-0002-4000-8002-000000000002","email":"stefan.schmidt@demo.nobleclean.de","email_verified":true}',
   'email', '2026-01-15 07:00:00+00', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  (gen_random_uuid(), 'marcel.braun@demo.nobleclean.de',
   'e3a00000-0003-4000-8003-000000000003',
   '{"sub":"e3a00000-0003-4000-8003-000000000003","email":"marcel.braun@demo.nobleclean.de","email_verified":true}',
   'email', '2026-02-01 07:00:00+00', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  (gen_random_uuid(), 'lisa.weber@demo.nobleclean.de',
   'e4a00000-0004-4000-8004-000000000004',
   '{"sub":"e4a00000-0004-4000-8004-000000000004","email":"lisa.weber@demo.nobleclean.de","email_verified":true}',
   'email', '2026-03-01 07:00:00+00', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00')
ON CONFLICT DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 2 — Profile
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at) VALUES
  ('a0a00000-0000-4000-8000-000000000000', 'Administrator', 'admin',    '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  ('e1a00000-0001-4000-8001-000000000001', 'Thomas Müller', 'employee', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  ('e2a00000-0002-4000-8002-000000000002', 'Stefan Schmidt','employee', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  ('e3a00000-0003-4000-8003-000000000003', 'Marcel Braun',  'employee', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00'),
  ('e4a00000-0004-4000-8004-000000000004', 'Lisa Weber',    'employee', '2026-01-10 08:00:00+00', '2026-01-10 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 3 — Kunden
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO public.clients (id, name, address, contact_info, is_active, created_at, updated_at) VALUES
  ('c1a00000-0001-4000-8001-000000000001',
   'John Reed Fitness',
   'Müllerstraße 12, 80469 München',
   '{"phone":"+49 89 00000000","email":"muenchen@johnreed.fitness"}',
   true, '2026-01-10 09:00:00+00', '2026-01-10 09:00:00+00'),
  ('c2a00000-0002-4000-8002-000000000002',
   'SportCity Hamburg',
   'Reeperbahn 45, 20359 Hamburg',
   '{"phone":"+49 40 00000000","email":"info@sportcity-hh.de"}',
   true, '2026-01-10 09:00:00+00', '2026-01-10 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 4 — Sektionsbaum John Reed (10 Hauptbereiche + 18 Unterbereiche)
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO public.sections (id, client_id, parent_section_id, name, sort_order) VALUES
  ('da100000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Eingangsbereich',    1),
  ('da200000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Cardio-Zone',        2),
  ('da300000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Kraftbereich',       3),
  ('da400000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Functional Zone',    4),
  ('da500000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Studios',            5),
  ('da600000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Umkleidebereiche',   6),
  ('da700000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Sanitäranlagen',     7),
  ('da800000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Gastronomie & Bar',  8),
  ('da900000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Personalbereich',    9),
  ('daa00000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', NULL, 'Außenbereich',      10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sections (id, client_id, parent_section_id, name, sort_order) VALUES
  ('db110000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da100000-0001-4000-8001-000000000001', 'Empfang & Rezeption',         1),
  ('db120000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da100000-0001-4000-8001-000000000001', 'Wartebereich / Lounge',       2),
  ('db210000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da200000-0001-4000-8001-000000000001', 'Laufbänder-Reihe',            1),
  ('db220000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da200000-0001-4000-8001-000000000001', 'Crosstrainer & Bikes',        2),
  ('db230000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da200000-0001-4000-8001-000000000001', 'Ruder- & Skiptrainer',        3),
  ('db310000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da300000-0001-4000-8001-000000000001', 'Freie Gewichte',              1),
  ('db320000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da300000-0001-4000-8001-000000000001', 'Kabelzug & Maschinen',        2),
  ('db330000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da300000-0001-4000-8001-000000000001', 'Stretching & Matten',         3),
  ('db510000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da500000-0001-4000-8001-000000000001', 'Studio A – Yoga / Pilates',   1),
  ('db520000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da500000-0001-4000-8001-000000000001', 'Studio B – Indoor-Cycling',   2),
  ('db530000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da500000-0001-4000-8001-000000000001', 'Studio C – HIIT',             3),
  ('db610000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da600000-0001-4000-8001-000000000001', 'Umkleide Herren',             1),
  ('db620000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da600000-0001-4000-8001-000000000001', 'Umkleide Damen',              2),
  ('db630000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da600000-0001-4000-8001-000000000001', 'Barrierefreie Umkleide',      3),
  ('db710000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da700000-0001-4000-8001-000000000001', 'WC & Duschen Herren',         1),
  ('db720000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da700000-0001-4000-8001-000000000001', 'WC & Duschen Damen',          2),
  ('db730000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da700000-0001-4000-8001-000000000001', 'Sauna & Dampfbad',            3),
  ('db910000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da900000-0001-4000-8001-000000000001', 'Personalraum & Küche',        1),
  ('db920000-0001-4000-8001-000000000001', 'c1a00000-0001-4000-8001-000000000001', 'da900000-0001-4000-8001-000000000001', 'Reinigungslager',             2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sections (id, client_id, parent_section_id, name, sort_order) VALUES
  ('dc100000-0002-4000-8002-000000000001', 'c2a00000-0002-4000-8002-000000000002', NULL, 'Trainingsbereich', 1),
  ('dc200000-0002-4000-8002-000000000001', 'c2a00000-0002-4000-8002-000000000002', NULL, 'Umkleiden',        2),
  ('dc300000-0002-4000-8002-000000000001', 'c2a00000-0002-4000-8002-000000000002', NULL, 'Sanitäranlagen',   3),
  ('dc400000-0002-4000-8002-000000000001', 'c2a00000-0002-4000-8002-000000000002', NULL, 'Eingang & Foyer',  4),
  ('dc500000-0002-4000-8002-000000000001', 'c2a00000-0002-4000-8002-000000000002', NULL, 'Personalbereich',  5)
ON CONFLICT (id) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 5 — Leaf-Items John Reed (86 Aufgaben)
   UUID-Schema: [4-stelliger Sektions-Code + 4 Nullen]-0000-4000-8000-[Nr.]
   Alle Zeichen sind gültige Hex-Ziffern (0-9, a-f).
   ───────────────────────────────────────────────────────────────────────── */

-- Empfang & Rezeption (Sektionscode 1101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('11010000-0000-4000-8000-000000000001', 'db110000-0001-4000-8001-000000000001', 'Empfangstheke desinfizieren',              1, 10, 1, 'normal'),
  ('11010000-0000-4000-8000-000000000002', 'db110000-0001-4000-8001-000000000001', 'Böden im Eingang feucht wischen',          1, 15, 1, 'normal'),
  ('11010000-0000-4000-8000-000000000003', 'db110000-0001-4000-8001-000000000001', 'Glastüren & Schaufenster reinigen',        2, 12, 1, 'normal'),
  ('11010000-0000-4000-8000-000000000004', 'db110000-0001-4000-8001-000000000001', 'Drehkreuz & Zugangssystem desinfizieren',  1,  8, 1, 'high_priority'),
  ('11010000-0000-4000-8000-000000000005', 'db110000-0001-4000-8001-000000000001', 'Mülleimer leeren & neu einlegen',          3,  6, 1, 'normal'),
  ('11010000-0000-4000-8000-000000000006', 'db110000-0001-4000-8001-000000000001', 'Sitzmöbel & Wartebereich abwischen',       1, 10, 2, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Wartebereich / Lounge (1201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('12010000-0000-4000-8000-000000000001', 'db120000-0001-4000-8001-000000000001', 'Loungemöbel abstauben & abwischen',  1, 12, 2, 'normal'),
  ('12010000-0000-4000-8000-000000000002', 'db120000-0001-4000-8001-000000000001', 'Boden staubsaugen & wischen',        1, 15, 1, 'normal'),
  ('12010000-0000-4000-8000-000000000003', 'db120000-0001-4000-8001-000000000001', 'Zeitschriften & Prospekte ordnen',   1,  5, 3, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Laufbänder-Reihe (2101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('21010000-0000-4000-8000-000000000001', 'db210000-0001-4000-8001-000000000001', 'Laufbänder desinfizieren (Handgriffe, Konsole, Band)', 12, 30, 1, 'high_priority'),
  ('21010000-0000-4000-8000-000000000002', 'db210000-0001-4000-8001-000000000001', 'Böden unter Laufbändern fegen & wischen',              1, 20, 1, 'normal'),
  ('21010000-0000-4000-8000-000000000003', 'db210000-0001-4000-8001-000000000001', 'Spiegel in Cardio-Zone reinigen',                      4, 12, 2, 'normal'),
  ('21010000-0000-4000-8000-000000000004', 'db210000-0001-4000-8001-000000000001', 'Desinfektionsmittel-Spender auffüllen',                 3,  5, 1, 'high_priority'),
  ('21010000-0000-4000-8000-000000000005', 'db210000-0001-4000-8001-000000000001', 'Papiertuchspender auffüllen',                          3,  5, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Crosstrainer & Bikes (2201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('22010000-0000-4000-8000-000000000001', 'db220000-0001-4000-8001-000000000001', 'Crosstrainer desinfizieren (Griffe, Display, Pedale)', 8, 20, 1, 'high_priority'),
  ('22010000-0000-4000-8000-000000000002', 'db220000-0001-4000-8001-000000000001', 'Ergometer / Bikes desinfizieren',                      6, 15, 1, 'high_priority'),
  ('22010000-0000-4000-8000-000000000003', 'db220000-0001-4000-8001-000000000001', 'Böden fegen & wischen',                                1, 18, 1, 'normal'),
  ('22010000-0000-4000-8000-000000000004', 'db220000-0001-4000-8001-000000000001', 'Handtuchbox befüllen',                                 2,  5, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Ruder- & Skiptrainer (2301)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('23010000-0000-4000-8000-000000000001', 'db230000-0001-4000-8001-000000000001', 'Rudergeräte reinigen & desinfizieren',   4, 16, 1, 'normal'),
  ('23010000-0000-4000-8000-000000000002', 'db230000-0001-4000-8001-000000000001', 'Skiptrainer / Stepmaster desinfizieren', 2,  8, 1, 'normal'),
  ('23010000-0000-4000-8000-000000000003', 'db230000-0001-4000-8001-000000000001', 'Böden wischen',                          1, 15, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Freie Gewichte (3101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('31010000-0000-4000-8000-000000000001', 'db310000-0001-4000-8001-000000000001', 'Kurz- & Langhanteln desinfizieren',           1, 25, 1, 'high_priority'),
  ('31010000-0000-4000-8000-000000000002', 'db310000-0001-4000-8001-000000000001', 'Hantelablage & Regale abwischen',             1, 12, 1, 'normal'),
  ('31010000-0000-4000-8000-000000000003', 'db310000-0001-4000-8001-000000000001', 'Squat-Racks & Bankdrückbänke desinfizieren', 4, 20, 1, 'high_priority'),
  ('31010000-0000-4000-8000-000000000004', 'db310000-0001-4000-8001-000000000001', 'Böden fegen & wischen',                      1, 20, 1, 'normal'),
  ('31010000-0000-4000-8000-000000000005', 'db310000-0001-4000-8001-000000000001', 'Spiegel reinigen',                           6, 10, 2, 'normal'),
  ('31010000-0000-4000-8000-000000000006', 'db310000-0001-4000-8001-000000000001', 'Gewichtsscheiben ordnen & abwischen',        1, 15, 2, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Kabelzug & Maschinen (3201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('32010000-0000-4000-8000-000000000001', 'db320000-0001-4000-8001-000000000001', 'Kraftmaschinen desinfizieren (Sitze, Griffe)', 14, 35, 1, 'high_priority'),
  ('32010000-0000-4000-8000-000000000002', 'db320000-0001-4000-8001-000000000001', 'Kabelzüge & Zugsysteme reinigen',               3, 12, 1, 'normal'),
  ('32010000-0000-4000-8000-000000000003', 'db320000-0001-4000-8001-000000000001', 'Böden zwischen Maschinen wischen',              1, 22, 1, 'normal'),
  ('32010000-0000-4000-8000-000000000004', 'db320000-0001-4000-8001-000000000001', 'Desinfektionsstationen auffüllen',              4,  6, 1, 'high_priority')
ON CONFLICT (id) DO NOTHING;

-- Stretching & Matten (3301)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('33010000-0000-4000-8000-000000000001', 'db330000-0001-4000-8001-000000000001', 'Yogamatten desinfizieren & trocknen lassen', 20, 25, 1, 'high_priority'),
  ('33010000-0000-4000-8000-000000000002', 'db330000-0001-4000-8001-000000000001', 'Foam Roller & Zubehör reinigen',              8, 10, 2, 'normal'),
  ('33010000-0000-4000-8000-000000000003', 'db330000-0001-4000-8001-000000000001', 'Boden wischen',                               1, 15, 1, 'normal'),
  ('33010000-0000-4000-8000-000000000004', 'db330000-0001-4000-8001-000000000001', 'Foam Roller ordentlich stapeln',              1,  5, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Functional Zone (4001)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('40010000-0000-4000-8000-000000000001', 'da400000-0001-4000-8001-000000000001', 'TRX-Bänder & Klettertaue abwischen',       4, 12, 2, 'normal'),
  ('40010000-0000-4000-8000-000000000002', 'da400000-0001-4000-8001-000000000001', 'Kettlebells desinfizieren',                12, 15, 1, 'normal'),
  ('40010000-0000-4000-8000-000000000003', 'da400000-0001-4000-8001-000000000001', 'Battle Ropes reinigen',                     2,  8, 2, 'normal'),
  ('40010000-0000-4000-8000-000000000004', 'da400000-0001-4000-8001-000000000001', 'Sprungboxen abwischen',                     4,  8, 2, 'normal'),
  ('40010000-0000-4000-8000-000000000005', 'da400000-0001-4000-8001-000000000001', 'Boden fegen & wischen',                     1, 20, 1, 'normal'),
  ('40010000-0000-4000-8000-000000000006', 'da400000-0001-4000-8001-000000000001', 'Wandbefestigungen kontrollieren',           1, 10, 7, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Studio A – Yoga / Pilates (5101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('51010000-0000-4000-8000-000000000001', 'db510000-0001-4000-8001-000000000001', 'Studioböden feucht wischen',              1, 20, 1, 'high_priority'),
  ('51010000-0000-4000-8000-000000000002', 'db510000-0001-4000-8001-000000000001', 'Matten desinfizieren',                   20, 20, 1, 'high_priority'),
  ('51010000-0000-4000-8000-000000000003', 'db510000-0001-4000-8001-000000000001', 'Spiegel reinigen',                        4, 10, 2, 'normal'),
  ('51010000-0000-4000-8000-000000000004', 'db510000-0001-4000-8001-000000000001', 'Lüftungsöffnungen abstauben',             4,  8, 7, 'normal'),
  ('51010000-0000-4000-8000-000000000005', 'db510000-0001-4000-8001-000000000001', 'Blocks & Props desinfizieren',            1, 10, 2, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Studio B – Indoor-Cycling (5201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('52010000-0000-4000-8000-000000000001', 'db520000-0001-4000-8001-000000000001', 'Spinning-Bikes komplett desinfizieren',     20, 40, 1, 'high_priority'),
  ('52010000-0000-4000-8000-000000000002', 'db520000-0001-4000-8001-000000000001', 'Böden wischen',                             1, 15, 1, 'normal'),
  ('52010000-0000-4000-8000-000000000003', 'db520000-0001-4000-8001-000000000001', 'Lautsprecher & Steuerpult abwischen',       1, 10, 2, 'normal'),
  ('52010000-0000-4000-8000-000000000004', 'db520000-0001-4000-8001-000000000001', 'Handtuchbox & Desinfektionsspender füllen', 2,  6, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Studio C – HIIT (5301)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('53010000-0000-4000-8000-000000000001', 'db530000-0001-4000-8001-000000000001', 'Böden desinfizieren (intensiv)',           1, 25, 1, 'high_priority'),
  ('53010000-0000-4000-8000-000000000002', 'db530000-0001-4000-8001-000000000001', 'Sprungseil & Kleingeräte reinigen',        1, 10, 1, 'normal'),
  ('53010000-0000-4000-8000-000000000003', 'db530000-0001-4000-8001-000000000001', 'Wandspiegel reinigen',                     2, 10, 2, 'normal'),
  ('53010000-0000-4000-8000-000000000004', 'db530000-0001-4000-8001-000000000001', 'Kühlbox in Studio reinigen',               1,  8, 7, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Umkleide Herren (6101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('61010000-0000-4000-8000-000000000001', 'db610000-0001-4000-8001-000000000001', 'Spinde außen abwischen & desinfizieren',  1, 20, 1, 'normal'),
  ('61010000-0000-4000-8000-000000000002', 'db610000-0001-4000-8001-000000000001', 'Bänke desinfizieren',                     8, 12, 1, 'high_priority'),
  ('61010000-0000-4000-8000-000000000003', 'db610000-0001-4000-8001-000000000001', 'Böden fegen & wischen',                   1, 18, 1, 'high_priority'),
  ('61010000-0000-4000-8000-000000000004', 'db610000-0001-4000-8001-000000000001', 'Spiegel reinigen',                        4,  8, 1, 'normal'),
  ('61010000-0000-4000-8000-000000000005', 'db610000-0001-4000-8001-000000000001', 'Mülleimer leeren & desinfizieren',        4,  6, 1, 'normal'),
  ('61010000-0000-4000-8000-000000000006', 'db610000-0001-4000-8001-000000000001', 'Föhn & Steckdosen abwischen',             4,  6, 2, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Umkleide Damen (6201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('62010000-0000-4000-8000-000000000001', 'db620000-0001-4000-8001-000000000001', 'Spinde außen abwischen & desinfizieren',  1, 20, 1, 'normal'),
  ('62010000-0000-4000-8000-000000000002', 'db620000-0001-4000-8001-000000000001', 'Bänke desinfizieren',                     8, 12, 1, 'high_priority'),
  ('62010000-0000-4000-8000-000000000003', 'db620000-0001-4000-8001-000000000001', 'Böden fegen & wischen',                   1, 18, 1, 'high_priority'),
  ('62010000-0000-4000-8000-000000000004', 'db620000-0001-4000-8001-000000000001', 'Spiegel reinigen',                        5,  8, 1, 'normal'),
  ('62010000-0000-4000-8000-000000000005', 'db620000-0001-4000-8001-000000000001', 'Mülleimer leeren',                        4,  6, 1, 'normal'),
  ('62010000-0000-4000-8000-000000000006', 'db620000-0001-4000-8001-000000000001', 'Schminkbereich & Ablage reinigen',        1, 10, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Barrierefreie Umkleide (6301)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('63010000-0000-4000-8000-000000000001', 'db630000-0001-4000-8001-000000000001', 'Gesamtfläche desinfizieren', 1, 15, 1, 'high_priority'),
  ('63010000-0000-4000-8000-000000000002', 'db630000-0001-4000-8001-000000000001', 'Haltegriffe desinfizieren',  4,  6, 1, 'high_priority'),
  ('63010000-0000-4000-8000-000000000003', 'db630000-0001-4000-8001-000000000001', 'Mülleimer leeren',           1,  4, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- WC & Duschen Herren (7101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('71010000-0000-4000-8000-000000000001', 'db710000-0001-4000-8001-000000000001', 'WC-Kabinen komplett reinigen & desinfizieren', 6, 30, 1, 'high_priority'),
  ('71010000-0000-4000-8000-000000000002', 'db710000-0001-4000-8001-000000000001', 'Urinale reinigen',                             4, 12, 1, 'high_priority'),
  ('71010000-0000-4000-8000-000000000003', 'db710000-0001-4000-8001-000000000001', 'Waschbecken & Armaturen desinfizieren',        4, 10, 1, 'high_priority'),
  ('71010000-0000-4000-8000-000000000004', 'db710000-0001-4000-8001-000000000001', 'Duschen schrubben & desinfizieren',            8, 30, 1, 'high_priority'),
  ('71010000-0000-4000-8000-000000000005', 'db710000-0001-4000-8001-000000000001', 'Böden & Abflüsse reinigen',                    1, 18, 1, 'high_priority'),
  ('71010000-0000-4000-8000-000000000006', 'db710000-0001-4000-8001-000000000001', 'Seifenspender & Papierhandtücher auffüllen',   8,  8, 1, 'normal'),
  ('71010000-0000-4000-8000-000000000007', 'db710000-0001-4000-8001-000000000001', 'Mülleimer leeren',                             4,  5, 1, 'normal'),
  ('71010000-0000-4000-8000-000000000008', 'db710000-0001-4000-8001-000000000001', 'Kalkflecken an Duschköpfen entfernen',         8, 20, 7, 'complaint')
ON CONFLICT (id) DO NOTHING;

-- WC & Duschen Damen (7201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('72010000-0000-4000-8000-000000000001', 'db720000-0001-4000-8001-000000000001', 'WC-Kabinen komplett reinigen & desinfizieren', 8, 35, 1, 'high_priority'),
  ('72010000-0000-4000-8000-000000000002', 'db720000-0001-4000-8001-000000000001', 'Waschbecken & Armaturen desinfizieren',        4, 10, 1, 'high_priority'),
  ('72010000-0000-4000-8000-000000000003', 'db720000-0001-4000-8001-000000000001', 'Duschen schrubben & desinfizieren',           10, 35, 1, 'high_priority'),
  ('72010000-0000-4000-8000-000000000004', 'db720000-0001-4000-8001-000000000001', 'Böden & Abflüsse reinigen',                    1, 18, 1, 'high_priority'),
  ('72010000-0000-4000-8000-000000000005', 'db720000-0001-4000-8001-000000000001', 'Seifenspender & Damenprodukte auffüllen',      8,  8, 1, 'normal'),
  ('72010000-0000-4000-8000-000000000006', 'db720000-0001-4000-8001-000000000001', 'Hygieneboxen entleeren & reinigen',            8, 10, 1, 'high_priority'),
  ('72010000-0000-4000-8000-000000000007', 'db720000-0001-4000-8001-000000000001', 'Kalkflecken an Duschköpfen entfernen',        10, 25, 7, 'complaint')
ON CONFLICT (id) DO NOTHING;

-- Sauna & Dampfbad (7301)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('73010000-0000-4000-8000-000000000001', 'db730000-0001-4000-8001-000000000001', 'Saunabänke schrubben',                  1, 20, 1, 'high_priority'),
  ('73010000-0000-4000-8000-000000000002', 'db730000-0001-4000-8001-000000000001', 'Saunaböden reinigen & desinfizieren',   1, 15, 1, 'high_priority'),
  ('73010000-0000-4000-8000-000000000003', 'db730000-0001-4000-8001-000000000001', 'Dampfbadkabine desinfizieren',          1, 15, 1, 'high_priority'),
  ('73010000-0000-4000-8000-000000000004', 'db730000-0001-4000-8001-000000000001', 'Ruhebereich & Liegen abwischen',        4, 12, 1, 'normal'),
  ('73010000-0000-4000-8000-000000000005', 'db730000-0001-4000-8001-000000000001', 'Aufgusseimer & Zubehör reinigen',       2,  8, 2, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Gastronomie & Bar (8001)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('80010000-0000-4000-8000-000000000001', 'da800000-0001-4000-8001-000000000001', 'Shake-Bar & Theke desinfizieren', 1, 15, 1, 'high_priority'),
  ('80010000-0000-4000-8000-000000000002', 'da800000-0001-4000-8001-000000000001', 'Sitzmöbel & Tische abwischen',    8, 12, 1, 'normal'),
  ('80010000-0000-4000-8000-000000000003', 'da800000-0001-4000-8001-000000000001', 'Böden kehren & wischen',          1, 15, 1, 'normal'),
  ('80010000-0000-4000-8000-000000000004', 'da800000-0001-4000-8001-000000000001', 'Mülleimer leeren',                3,  5, 1, 'normal'),
  ('80010000-0000-4000-8000-000000000005', 'da800000-0001-4000-8001-000000000001', 'Kühlvitrine außen reinigen',      1, 10, 2, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Personalraum & Küche (9101)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('91010000-0000-4000-8000-000000000001', 'db910000-0001-4000-8001-000000000001', 'Küchenarbeitsflächen desinfizieren', 1, 10, 1, 'normal'),
  ('91010000-0000-4000-8000-000000000002', 'db910000-0001-4000-8001-000000000001', 'Mikrowelle & Kühlschrank innen',     1, 12, 7, 'normal'),
  ('91010000-0000-4000-8000-000000000003', 'db910000-0001-4000-8001-000000000001', 'Böden wischen',                      1, 10, 1, 'normal'),
  ('91010000-0000-4000-8000-000000000004', 'db910000-0001-4000-8001-000000000001', 'Mülleimer leeren',                   2,  5, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Reinigungslager (9201)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('92010000-0000-4000-8000-000000000001', 'db920000-0001-4000-8001-000000000001', 'Lager ordnen & Vorräte prüfen',                   1, 15, 7, 'normal'),
  ('92010000-0000-4000-8000-000000000002', 'db920000-0001-4000-8001-000000000001', 'Reinigungsgeräte reinigen (Mopp, Eimer, Bürsten)', 1, 20, 2, 'normal'),
  ('92010000-0000-4000-8000-000000000003', 'db920000-0001-4000-8001-000000000001', 'Verbrauchsmittel nachbestellen (Liste führen)',    1, 10, 7, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Außenbereich (a001)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('a0010000-0000-4000-8000-000000000001', 'daa00000-0001-4000-8001-000000000001', 'Eingangsbereich außen kehren', 1, 15, 1, 'normal'),
  ('a0010000-0000-4000-8000-000000000002', 'daa00000-0001-4000-8001-000000000001', 'Fahrradständer abwischen',    6,  8, 3, 'normal'),
  ('a0010000-0000-4000-8000-000000000003', 'daa00000-0001-4000-8001-000000000001', 'Außenfenster reinigen',        1, 30, 7, 'normal'),
  ('a0010000-0000-4000-8000-000000000004', 'daa00000-0001-4000-8001-000000000001', 'Außenmülleimer leeren',        2,  5, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

-- SportCity Hamburg (c101, c201, c301, c401, c501)
INSERT INTO public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag) VALUES
  ('c1010000-0000-4000-8002-000000000001', 'dc100000-0002-4000-8002-000000000001', 'Trainingsgeräte desinfizieren', 1, 40, 1, 'high_priority'),
  ('c1010000-0000-4000-8002-000000000002', 'dc100000-0002-4000-8002-000000000001', 'Böden fegen & wischen',         1, 25, 1, 'normal'),
  ('c1010000-0000-4000-8002-000000000003', 'dc100000-0002-4000-8002-000000000001', 'Spiegel reinigen',              6, 12, 2, 'normal'),
  ('c2010000-0000-4000-8002-000000000001', 'dc200000-0002-4000-8002-000000000001', 'Umkleide Herren reinigen',      1, 30, 1, 'high_priority'),
  ('c2010000-0000-4000-8002-000000000002', 'dc200000-0002-4000-8002-000000000001', 'Umkleide Damen reinigen',       1, 30, 1, 'high_priority'),
  ('c3010000-0000-4000-8002-000000000001', 'dc300000-0002-4000-8002-000000000001', 'WC & Duschen reinigen',         1, 45, 1, 'high_priority'),
  ('c3010000-0000-4000-8002-000000000002', 'dc300000-0002-4000-8002-000000000001', 'Seifenspender auffüllen',       6,  8, 1, 'normal'),
  ('c4010000-0000-4000-8002-000000000001', 'dc400000-0002-4000-8002-000000000001', 'Eingangsbereich kehren',        1, 12, 1, 'normal'),
  ('c4010000-0000-4000-8002-000000000002', 'dc400000-0002-4000-8002-000000000001', 'Glastüren reinigen',            2, 10, 1, 'normal'),
  ('c5010000-0000-4000-8002-000000000001', 'dc500000-0002-4000-8002-000000000001', 'Personalraum reinigen',         1, 15, 1, 'normal')
ON CONFLICT (id) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 6 — Mitarbeiterzuweisungen (alle 4 → John Reed Fitness)
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO public.employee_client_assignments
  (id, employee_id, client_id, start_date, end_date) VALUES
  ('ab100000-0001-4000-8001-000000000001',
   'e1a00000-0001-4000-8001-000000000001',
   'c1a00000-0001-4000-8001-000000000001', '2026-01-15', NULL),
  ('ab200000-0002-4000-8002-000000000001',
   'e2a00000-0002-4000-8002-000000000002',
   'c1a00000-0001-4000-8001-000000000001', '2026-01-15', NULL),
  ('ab300000-0003-4000-8003-000000000001',
   'e3a00000-0003-4000-8003-000000000003',
   'c1a00000-0001-4000-8001-000000000001', '2026-02-01', NULL),
  ('ab400000-0004-4000-8004-000000000001',
   'e4a00000-0004-4000-8004-000000000004',
   'c1a00000-0001-4000-8001-000000000001', '2026-03-01', NULL)
ON CONFLICT (id) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 7 — Arbeitspläne (work_schedule) via generate_series
   ───────────────────────────────────────────────────────────────────────── */
-- Thomas: Mo–Fr, 6h/Tag ab 15.01.
INSERT INTO public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
SELECT gen_random_uuid(),
       'e1a00000-0001-4000-8001-000000000001',
       'c1a00000-0001-4000-8001-000000000001',
       d::date, 6.00
FROM generate_series('2026-01-15'::date, '2026-07-30'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- Stefan: Mo–Fr, 6h/Tag ab 15.01.
INSERT INTO public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
SELECT gen_random_uuid(),
       'e2a00000-0002-4000-8002-000000000002',
       'c1a00000-0001-4000-8001-000000000001',
       d::date, 6.00
FROM generate_series('2026-01-15'::date, '2026-07-30'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- Marcel: Mo–Fr, 5h/Tag ab 01.02.
INSERT INTO public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
SELECT gen_random_uuid(),
       'e3a00000-0003-4000-8003-000000000003',
       'c1a00000-0001-4000-8001-000000000001',
       d::date, 5.00
FROM generate_series('2026-02-01'::date, '2026-07-30'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- Lisa: Mo/Mi/Fr, 4h/Tag ab 01.03. (Teilzeit)
INSERT INTO public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
SELECT gen_random_uuid(),
       'e4a00000-0004-4000-8004-000000000004',
       'c1a00000-0001-4000-8001-000000000001',
       d::date, 4.00
FROM generate_series('2026-03-01'::date, '2026-07-30'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) IN (1, 3, 5)
ON CONFLICT (employee_id, work_date) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 8 — Tagespläne (daily_plans)
   Vergangene Tage = submitted | Heute & Zukunft = in_progress
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO public.daily_plans (id, employee_id, client_id, work_date, status, submitted_at)
SELECT
  gen_random_uuid(),
  ws.employee_id,
  ws.client_id,
  ws.work_date,
  CASE WHEN ws.work_date < CURRENT_DATE
       THEN 'submitted'::public.plan_status
       ELSE 'in_progress'::public.plan_status END,
  CASE WHEN ws.work_date < CURRENT_DATE
       THEN ws.work_date::timestamptz + '16:45:00'::interval
       ELSE NULL END
FROM public.work_schedule ws
WHERE ws.employee_id IN (
  'e1a00000-0001-4000-8001-000000000001',
  'e2a00000-0002-4000-8002-000000000002',
  'e3a00000-0003-4000-8003-000000000003',
  'e4a00000-0004-4000-8004-000000000004'
)
ON CONFLICT (employee_id, work_date) DO NOTHING;

/* ─────────────────────────────────────────────────────────────────────────
   SCHRITT 9 — Tagesplan-Items (daily_plan_items)
   14 Items pro Plan  |  ~93% Abschlussquote (jedes 14. übersprungen)
   ───────────────────────────────────────────────────────────────────────── */
INSERT INTO public.daily_plan_items
  (id, daily_plan_id, leaf_item_id, is_completed, completed_at)
SELECT
  gen_random_uuid(),
  dp.id,
  items.leaf_item_id,
  CASE
    WHEN dp.status = 'submitted' AND items.rn % 14 != 0 THEN true
    ELSE false
  END,
  CASE
    WHEN dp.status = 'submitted' AND items.rn % 14 != 0
    THEN dp.work_date::timestamptz + make_interval(hours => 7, mins => ((items.rn * 13) % 540)::integer)
    ELSE NULL
  END
FROM public.daily_plans dp
CROSS JOIN LATERAL (
  SELECT
    li.id AS leaf_item_id,
    ROW_NUMBER() OVER (ORDER BY li.id) AS rn
  FROM public.leaf_items li
  JOIN public.sections s ON s.id = li.section_id
  WHERE s.client_id = dp.client_id
  ORDER BY li.id
  LIMIT 14
) AS items
ON CONFLICT (daily_plan_id, leaf_item_id) DO NOTHING;

COMMIT;

/* ═══════════════════════════════════════════════════════════════════════════
   QUICK-CHECK (separat ausführen nach dem Import):

   SELECT 'profiles'         AS tbl, COUNT(*) FROM public.profiles            UNION ALL
   SELECT 'clients'          AS tbl, COUNT(*) FROM public.clients             UNION ALL
   SELECT 'sections'         AS tbl, COUNT(*) FROM public.sections            UNION ALL
   SELECT 'leaf_items'       AS tbl, COUNT(*) FROM public.leaf_items          UNION ALL
   SELECT 'assignments'      AS tbl, COUNT(*) FROM public.employee_client_assignments UNION ALL
   SELECT 'work_schedule'    AS tbl, COUNT(*) FROM public.work_schedule       UNION ALL
   SELECT 'daily_plans'      AS tbl, COUNT(*) FROM public.daily_plans         UNION ALL
   SELECT 'daily_plan_items' AS tbl, COUNT(*) FROM public.daily_plan_items;
   ═══════════════════════════════════════════════════════════════════════════ */
