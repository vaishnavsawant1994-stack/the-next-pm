-- Phase 1 / source-first election and editorial data model.
CREATE TABLE staff_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE, display_name text NOT NULL,
 role text NOT NULL CHECK(role IN ('admin','operator','reviewer','publisher')),
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL, publisher text NOT NULL,
 source_url text NOT NULL UNIQUE CHECK(source_url ~ '^https://'),
 type text NOT NULL DEFAULT 'official',
 review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','verified','rejected')),
 reuse_status text NOT NULL DEFAULT 'link_only',
 original_published_at timestamptz, captured_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid REFERENCES staff_members(id),
 verified_by uuid REFERENCES staff_members(id), verified_at timestamptz,
 review_notes text,
 CHECK((review_status='verified' AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    OR (review_status<>'verified' AND verified_at IS NULL)),
 CHECK(created_by IS NULL OR verified_by IS NULL OR created_by<>verified_by)
);

CREATE TABLE state_regions (
 slug text PRIMARY KEY CHECK(slug ~ '^[a-z]+(-[a-z]+)*$'),
 name text NOT NULL UNIQUE,
 assembly_seat_count int NOT NULL CHECK(assembly_seat_count>0),
 baseline_source_id uuid REFERENCES source_documents(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE election_cycles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 region_slug text NOT NULL REFERENCES state_regions(slug),
 election_year int NOT NULL CHECK(election_year BETWEEN 1950 AND 2200),
 chamber text NOT NULL CHECK(chamber IN ('assembly','lok_sabha')),
 expected_window text NOT NULL,
 status text NOT NULL DEFAULT 'expected' CHECK(status IN ('expected','announced','completed','cancelled')),
 official_poll_date date,
 announcement_source_id uuid REFERENCES source_documents(id),
 published_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(region_slug,election_year,chamber),
 CHECK((status='expected' AND official_poll_date IS NULL AND announcement_source_id IS NULL)
    OR (status='cancelled' AND official_poll_date IS NULL)
    OR (status IN ('announced','completed') AND official_poll_date IS NOT NULL AND announcement_source_id IS NOT NULL))
);

CREATE TABLE constituencies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 region_slug text NOT NULL REFERENCES state_regions(slug),
 chamber text NOT NULL CHECK(chamber IN ('assembly','lok_sabha')),
 official_number int NOT NULL CHECK(official_number>0),
 official_name text NOT NULL,
 boundary_version text NOT NULL DEFAULT 'current',
 source_id uuid NOT NULL REFERENCES source_documents(id),
 publication_status text NOT NULL DEFAULT 'draft' CHECK(publication_status IN ('draft','published','archived')),
 UNIQUE(region_slug,chamber,official_number,boundary_version)
);

CREATE TABLE parties (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 official_name text NOT NULL, abbreviation text,
 source_id uuid NOT NULL REFERENCES source_documents(id)
);
CREATE TABLE people (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 public_name text NOT NULL
);
CREATE TABLE candidacies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 election_id uuid NOT NULL REFERENCES election_cycles(id),
 constituency_id uuid NOT NULL REFERENCES constituencies(id),
 person_id uuid NOT NULL REFERENCES people(id),
 party_id uuid REFERENCES parties(id),
 nomination_status text NOT NULL CHECK(nomination_status IN ('filed','accepted','rejected','withdrawn','contesting')),
 source_id uuid NOT NULL REFERENCES source_documents(id),
 UNIQUE(election_id,constituency_id,person_id)
);
CREATE TABLE official_results (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 election_id uuid NOT NULL REFERENCES election_cycles(id),
 constituency_id uuid NOT NULL REFERENCES constituencies(id),
 candidacy_id uuid NOT NULL REFERENCES candidacies(id),
 votes bigint CHECK(votes>=0),
 stage text NOT NULL CHECK(stage IN ('provisional','declared','final_form20')),
 source_id uuid NOT NULL REFERENCES source_documents(id),
 source_timestamp timestamptz NOT NULL,
 published_at timestamptz,
 UNIQUE(election_id,constituency_id,candidacy_id,stage,source_timestamp)
);

CREATE TABLE editorial_changes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('calendar_announcement','source_correction','constituency_correction')),
 region_slug text REFERENCES state_regions(slug),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 source_id uuid NOT NULL REFERENCES source_documents(id),
 submitted_by uuid NOT NULL REFERENCES staff_members(id),
 submitted_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','published')),
 reviewed_by uuid REFERENCES staff_members(id),
 reviewed_at timestamptz, review_notes text,
 published_by uuid REFERENCES staff_members(id), published_at timestamptz,
 CHECK(reviewed_by IS NULL OR reviewed_by<>submitted_by),
 CHECK(published_by IS NULL OR published_by<>submitted_by),
 CHECK(status IN ('pending','rejected') OR reviewed_by IS NOT NULL),
 CHECK(status<>'published' OR (published_by IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX editorial_changes_queue ON editorial_changes(status,submitted_at DESC);

CREATE TABLE editorial_audit (
 id bigserial PRIMARY KEY,
 actor_id uuid REFERENCES staff_members(id),
 event_type text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'Editorial audit history is append-only';
END;
$$;
CREATE TRIGGER editorial_audit_append_only BEFORE UPDATE OR DELETE ON editorial_audit
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

CREATE INDEX election_cycles_year_idx ON election_cycles(election_year,status);
CREATE INDEX source_documents_status_idx ON source_documents(review_status);
