-- Each imported constituency is tied to one source, a submitted batch and
-- independently reviewed publication. Draft records are never public.
CREATE TABLE constituency_import_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 region_slug text NOT NULL REFERENCES state_regions(slug),
 source_id uuid NOT NULL REFERENCES source_documents(id),
 original_file_sha256 text NOT NULL CHECK(original_file_sha256 ~ '^[0-9a-f]{64}$'),
 row_count int NOT NULL CHECK(row_count BETWEEN 1 AND 500),
 status text NOT NULL DEFAULT 'pending'
   CHECK(status IN ('pending','approved','rejected','published')),
 submitted_by uuid NOT NULL REFERENCES staff_members(id),
 submitted_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by uuid REFERENCES staff_members(id),
 reviewed_at timestamptz,
 review_notes text,
 published_by uuid REFERENCES staff_members(id),
 published_at timestamptz,
 CHECK(reviewed_by IS NULL OR reviewed_by<>submitted_by),
 CHECK(published_by IS NULL OR published_by<>submitted_by),
 CHECK(status IN ('pending','rejected') OR reviewed_by IS NOT NULL),
 CHECK(status<>'published' OR (published_by IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX constituency_import_batch_queue
 ON constituency_import_batches(status,submitted_at DESC);
ALTER TABLE constituencies
 ADD COLUMN import_batch_id uuid REFERENCES constituency_import_batches(id);
CREATE INDEX constituency_public_directory
 ON constituencies(region_slug,official_number) WHERE publication_status='published';
