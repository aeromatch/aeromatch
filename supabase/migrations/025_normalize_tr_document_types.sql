-- Normaliza doc_type de type ratings por variante → clave por serie EASA (coincide con seriesToDocSlug en app)
-- Columna real: doc_type (no document_type)

-- Airbus narrow body → type_a318_a319_a320_a321_*
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_theory' WHERE doc_type IN (
  'type_a318_theory', 'type_a319_theory', 'type_a320_theory', 'type_a320neo_theory',
  'type_a321_theory', 'type_a321neo_theory', 'type_a321xlr_theory'
);
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_practical' WHERE doc_type IN (
  'type_a318_practical', 'type_a319_practical', 'type_a320_practical', 'type_a320neo_practical',
  'type_a321_practical', 'type_a321neo_practical', 'type_a321xlr_practical'
);

-- A330
UPDATE public.documents SET doc_type = 'type_a330_theory' WHERE doc_type IN (
  'type_a330-200_theory', 'type_a330-300_theory', 'type_a330neo_theory'
);
UPDATE public.documents SET doc_type = 'type_a330_practical' WHERE doc_type IN (
  'type_a330-200_practical', 'type_a330-300_practical', 'type_a330neo_practical'
);

-- A350
UPDATE public.documents SET doc_type = 'type_a350_theory' WHERE doc_type IN (
  'type_a350-900_theory', 'type_a350-1000_theory'
);
UPDATE public.documents SET doc_type = 'type_a350_practical' WHERE doc_type IN (
  'type_a350-900_practical', 'type_a350-1000_practical'
);

-- A380 (slug ya canónico: type_a380_*)

-- B737 (incl. variantes con guión; MAX con espacios por toLowerCase del catálogo)
UPDATE public.documents SET doc_type = 'type_b737_theory' WHERE doc_type IN (
  'type_b737-700_theory', 'type_b737-800_theory', 'type_b737-900_theory',
  'type_b737 max 8_theory', 'type_b737 max 9_theory'
);
UPDATE public.documents SET doc_type = 'type_b737_practical' WHERE doc_type IN (
  'type_b737-700_practical', 'type_b737-800_practical', 'type_b737-900_practical',
  'type_b737 max 8_practical', 'type_b737 max 9_practical'
);

-- B757/B767
UPDATE public.documents SET doc_type = 'type_b757_b767_theory' WHERE doc_type IN (
  'type_b757-200_theory', 'type_b757-300_theory',
  'type_b767-200_theory', 'type_b767-300_theory', 'type_b767-400_theory'
);
UPDATE public.documents SET doc_type = 'type_b757_b767_practical' WHERE doc_type IN (
  'type_b757-200_practical', 'type_b757-300_practical',
  'type_b767-200_practical', 'type_b767-300_practical', 'type_b767-400_practical'
);

-- B777
UPDATE public.documents SET doc_type = 'type_b777_theory' WHERE doc_type IN (
  'type_b777-200_theory', 'type_b777-300_theory', 'type_b777x_theory'
);
UPDATE public.documents SET doc_type = 'type_b777_practical' WHERE doc_type IN (
  'type_b777-200_practical', 'type_b777-300_practical', 'type_b777x_practical'
);

-- B787
UPDATE public.documents SET doc_type = 'type_b787_theory' WHERE doc_type IN (
  'type_b787_theory', 'type_b787-8_theory', 'type_b787-9_theory', 'type_b787-10_theory'
);
UPDATE public.documents SET doc_type = 'type_b787_practical' WHERE doc_type IN (
  'type_b787_practical', 'type_b787-8_practical', 'type_b787-9_practical', 'type_b787-10_practical'
);

-- B747
UPDATE public.documents SET doc_type = 'type_b747_theory' WHERE doc_type IN (
  'type_b747-400_theory', 'type_b747-8_theory'
);
UPDATE public.documents SET doc_type = 'type_b747_practical' WHERE doc_type IN (
  'type_b747-400_practical', 'type_b747-8_practical'
);

-- ATR (catálogo con espacio)
UPDATE public.documents SET doc_type = 'type_atr42_72_theory' WHERE doc_type IN (
  'type_atr42_theory', 'type_atr72_theory',
  'type_atr 42-300_theory', 'type_atr 42-500_theory', 'type_atr 42-600_theory',
  'type_atr 72-200_theory', 'type_atr 72-500_theory', 'type_atr 72-600_theory'
);
UPDATE public.documents SET doc_type = 'type_atr42_72_practical' WHERE doc_type IN (
  'type_atr42_practical', 'type_atr72_practical',
  'type_atr 42-300_practical', 'type_atr 42-500_practical', 'type_atr 42-600_practical',
  'type_atr 72-200_practical', 'type_atr 72-500_practical', 'type_atr 72-600_practical'
);

-- Extras (mismo patrón de sufijos)
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_runup' WHERE doc_type IN (
  'type_a318_runup', 'type_a319_runup', 'type_a320_runup', 'type_a320neo_runup',
  'type_a321_runup', 'type_a321neo_runup', 'type_a321xlr_runup'
);
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_borescope' WHERE doc_type IN (
  'type_a318_borescope', 'type_a319_borescope', 'type_a320_borescope', 'type_a320neo_borescope',
  'type_a321_borescope', 'type_a321neo_borescope', 'type_a321xlr_borescope'
);
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_ndt' WHERE doc_type IN (
  'type_a318_ndt', 'type_a319_ndt', 'type_a320_ndt', 'type_a320neo_ndt',
  'type_a321_ndt', 'type_a321neo_ndt', 'type_a321xlr_ndt'
);
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_engine_specific' WHERE doc_type IN (
  'type_a318_engine_specific', 'type_a319_engine_specific', 'type_a320_engine_specific', 'type_a320neo_engine_specific',
  'type_a321_engine_specific', 'type_a321neo_engine_specific', 'type_a321xlr_engine_specific'
);
UPDATE public.documents SET doc_type = 'type_a318_a319_a320_a321_custom' WHERE doc_type IN (
  'type_a318_custom', 'type_a319_custom', 'type_a320_custom', 'type_a320neo_custom',
  'type_a321_custom', 'type_a321neo_custom', 'type_a321xlr_custom'
);

-- Duplicados tras fusionar: mantener la fila con id menor
DELETE FROM public.documents d
WHERE d.id IN (
  SELECT d2.id FROM public.documents d2
  INNER JOIN public.documents d3
    ON d2.technician_id = d3.technician_id
    AND d2.doc_type = d3.doc_type
    AND d2.id > d3.id
  WHERE COALESCE(d2.is_deleted, false) = false
    AND COALESCE(d3.is_deleted, false) = false
);
