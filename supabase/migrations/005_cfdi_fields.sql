-- CFDI / SAT fiscal fields

-- Organizations: fiscal data
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS rfc              text,
  ADD COLUMN IF NOT EXISTS razon_social     text,
  ADD COLUMN IF NOT EXISTS regimen_fiscal   text DEFAULT '601',
  ADD COLUMN IF NOT EXISTS fiscal_zip       text,
  ADD COLUMN IF NOT EXISTS cer_content      text,  -- base64 .cer
  ADD COLUMN IF NOT EXISTS key_content      text,  -- base64 .key (encrypted at rest)
  ADD COLUMN IF NOT EXISTS key_password     text,  -- encrypted key password
  ADD COLUMN IF NOT EXISTS pac_username     text,  -- SW SapienS user
  ADD COLUMN IF NOT EXISTS pac_password     text;  -- SW SapienS password

-- Products: SAT catalog keys
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sat_product_key  text DEFAULT '01010101',
  ADD COLUMN IF NOT EXISTS sat_unit_key     text DEFAULT 'H87',
  ADD COLUMN IF NOT EXISTS sat_unit_name    text DEFAULT 'Pieza';

-- Customers: RFC / fiscal data for CFDI recipient
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS rfc              text,
  ADD COLUMN IF NOT EXISTS razon_social     text,
  ADD COLUMN IF NOT EXISTS regimen_fiscal   text,
  ADD COLUMN IF NOT EXISTS fiscal_zip       text,
  ADD COLUMN IF NOT EXISTS uso_cfdi         text DEFAULT 'G03';

-- Sales: CFDI stamp result
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS cfdi_uuid        uuid,
  ADD COLUMN IF NOT EXISTS cfdi_xml         text,
  ADD COLUMN IF NOT EXISTS cfdi_pdf_url     text,
  ADD COLUMN IF NOT EXISTS cfdi_status      text DEFAULT 'sin_timbrar'
                                             CHECK (cfdi_status IN ('sin_timbrar','timbrado','cancelado'));

CREATE INDEX IF NOT EXISTS idx_sales_cfdi_uuid ON sales(cfdi_uuid) WHERE cfdi_uuid IS NOT NULL;

-- Quotes: Conekta payment link
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS payment_link_id  text,
  ADD COLUMN IF NOT EXISTS payment_link_url text,
  ADD COLUMN IF NOT EXISTS payment_link_exp timestamptz;
