-- Mondo Medical -- realtime notifications for new quote requests.
-- Run this ONCE in the Supabase SQL Editor, AFTER migration_003_brand_photos.sql.
-- Lets the admin dashboard receive new quote requests live (notification +
-- list/stats update) without needing to refresh the page.

alter publication supabase_realtime add table quote_requests;
