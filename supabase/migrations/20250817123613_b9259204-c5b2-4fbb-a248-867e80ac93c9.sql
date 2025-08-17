-- Add unique constraint to prevent multiple active plans per client
ALTER TABLE subscription_plans 
ADD CONSTRAINT unique_active_plan_per_client 
UNIQUE (client_id, is_active) 
DEFERRABLE INITIALLY DEFERRED;