-- Add CPA tracking columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cpa_house text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cpa_value numeric DEFAULT 150.00;

-- Comment on columns
COMMENT ON COLUMN leads.cpa_house IS 'The betting house where the lead registered (e.g. Novibet, Betano)';
COMMENT ON COLUMN leads.cpa_value IS 'The affiliate commission value for this lead';
