-- This migration became invalid for fresh databases because it referenced
-- LiveClassPurchase artifacts before they are created in a later migration.
-- Keep this as a no-op for forward-only production safety.
SELECT 1;
