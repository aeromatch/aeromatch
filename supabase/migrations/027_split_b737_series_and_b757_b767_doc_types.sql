-- Separa doc_type B737 unificado en Classic / NG / MAX y B757/B767 en series independientes.
-- Orden importa: primero variantes específicas, luego el genérico type_b737_*.

-- MAX (antes de mezclar con NG)
UPDATE public.documents SET doc_type = 'type_b737_max_theory' WHERE doc_type IN (
  'type_b737 max 7_theory', 'type_b737 max 8_theory', 'type_b737 max 9_theory', 'type_b737 max 10_theory'
);
UPDATE public.documents SET doc_type = 'type_b737_max_practical' WHERE doc_type IN (
  'type_b737 max 7_practical', 'type_b737 max 8_practical', 'type_b737 max 9_practical', 'type_b737 max 10_practical'
);

-- Classic
UPDATE public.documents SET doc_type = 'type_b737_classic_theory' WHERE doc_type IN (
  'type_b737-300_theory', 'type_b737-400_theory', 'type_b737-500_theory'
);
UPDATE public.documents SET doc_type = 'type_b737_classic_practical' WHERE doc_type IN (
  'type_b737-300_practical', 'type_b737-400_practical', 'type_b737-500_practical'
);

-- NG
UPDATE public.documents SET doc_type = 'type_b737_ng_theory' WHERE doc_type IN (
  'type_b737-600_theory', 'type_b737-700_theory', 'type_b737-800_theory', 'type_b737-900_theory'
);
UPDATE public.documents SET doc_type = 'type_b737_ng_practical' WHERE doc_type IN (
  'type_b737-600_practical', 'type_b737-700_practical', 'type_b737-800_practical', 'type_b737-900_practical'
);

-- Genérico ya normalizado (025) → NG por defecto
UPDATE public.documents SET doc_type = 'type_b737_ng_theory' WHERE doc_type = 'type_b737_theory';
UPDATE public.documents SET doc_type = 'type_b737_ng_practical' WHERE doc_type = 'type_b737_practical';

-- B757/B767: partir por nombre de fichero (sin columna sub_type en documents)
UPDATE public.documents d
SET doc_type = 'type_b767_theory'
WHERE d.doc_type = 'type_b757_b767_theory'
  AND COALESCE(d.file_name, '') ILIKE '%767%'
  AND COALESCE(d.file_name, '') NOT ILIKE '%757%';

UPDATE public.documents d
SET doc_type = 'type_b767_practical'
WHERE d.doc_type = 'type_b757_b767_practical'
  AND COALESCE(d.file_name, '') ILIKE '%767%'
  AND COALESCE(d.file_name, '') NOT ILIKE '%757%';

UPDATE public.documents d
SET doc_type = 'type_b757_theory'
WHERE d.doc_type = 'type_b757_b767_theory'
  AND COALESCE(d.file_name, '') ILIKE '%757%'
  AND COALESCE(d.file_name, '') NOT ILIKE '%767%';

UPDATE public.documents d
SET doc_type = 'type_b757_practical'
WHERE d.doc_type = 'type_b757_b767_practical'
  AND COALESCE(d.file_name, '') ILIKE '%757%'
  AND COALESCE(d.file_name, '') NOT ILIKE '%767%';

UPDATE public.documents SET doc_type = 'type_b757_b767_legacy_theory' WHERE doc_type = 'type_b757_b767_theory';
UPDATE public.documents SET doc_type = 'type_b757_b767_legacy_practical' WHERE doc_type = 'type_b757_b767_practical';
