-- =============================================================================
-- Analytics Seed Data
--
-- Generates realistic-looking analytics data for the past 90 days.
-- Run via: npm run db:seed
-- =============================================================================

-- Clear existing data
DELETE FROM analytics_visits;
DELETE FROM analytics_events;

-- ============================================================================
-- Page visits: ~2500 visits across 90 days with realistic distribution
-- More traffic on recent days, weekdays heavier than weekends
-- ============================================================================

-- Helper: we use strftime('%s','now') as "now" and subtract seconds for past days.
-- Each row: (path, visitor_hash, referer, user_agent, country, created_at)

-- Day offsets: 0 = today, 1 = yesterday, etc.
-- We'll insert batches per "day bucket" with varying volume.

-- Popular pages get more visits, long-tail pages get fewer.
-- Countries: IT (40%), US (20%), DE (10%), GB (8%), FR (7%), others (15%)

-- ── Homepage & About (high traffic) ─────────────────────────────────────────

INSERT INTO analytics_visits (path, visitor_hash, referer, user_agent, country, created_at) VALUES
('/', 'a1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 3600),
('/', 'a1b2c3d4e5f60002', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 0 + 7200),
('/', 'a1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 0 + 10800),
('/', 'a1b2c3d4e5f60004', 'https://twitter.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 1 + 3600),
('/', 'a1b2c3d4e5f60005', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 1 + 14400),
('/', 'a1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 1 + 28800),
('/', 'a1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'FR', strftime('%s','now') - 86400 * 2 + 3600),
('/', 'a1b2c3d4e5f60008', 'https://google.it', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 2 + 18000),
('/', 'a1b2c3d4e5f60009', 'https://duckduckgo.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 3 + 7200),
('/', 'a1b2c3d4e5f60010', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 3 + 21600),
('/', 'a1b2c3d4e5f60011', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 4 + 10800),
('/', 'a1b2c3d4e5f60012', 'https://bing.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 5 + 7200),
('/', 'a1b2c3d4e5f60013', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 6 + 14400),
('/', 'a1b2c3d4e5f60014', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 7 + 3600),
('/', 'a1b2c3d4e5f60015', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'ES', strftime('%s','now') - 86400 * 8 + 18000),
('/', 'a1b2c3d4e5f60016', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 10 + 7200),
('/', 'a1b2c3d4e5f60017', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 12 + 10800),
('/', 'a1b2c3d4e5f60018', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 15 + 14400),
('/', 'a1b2c3d4e5f60019', 'https://google.de', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'DE', strftime('%s','now') - 86400 * 18 + 21600),
('/', 'a1b2c3d4e5f60020', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 20 + 3600),
('/', 'a1b2c3d4e5f60021', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'BR', strftime('%s','now') - 86400 * 25 + 7200),
('/', 'a1b2c3d4e5f60022', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 30 + 14400),
('/', 'a1b2c3d4e5f60023', 'https://hackernews.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 35 + 10800),
('/', 'a1b2c3d4e5f60024', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'JP', strftime('%s','now') - 86400 * 40 + 18000),
('/', 'a1b2c3d4e5f60025', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 50 + 3600),
('/', 'a1b2c3d4e5f60026', 'https://google.fr', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'FR', strftime('%s','now') - 86400 * 60 + 14400),
('/', 'a1b2c3d4e5f60027', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 70 + 7200),
('/', 'a1b2c3d4e5f60028', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'NL', strftime('%s','now') - 86400 * 80 + 21600),
('/', 'a1b2c3d4e5f60029', 'https://twitter.com', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 85 + 10800),
('/', 'a1b2c3d4e5f60030', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 89 + 3600),
('/about', 'a1b2c3d4e5f60001', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 5400),
('/about', 'a1b2c3d4e5f60004', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 1 + 5400),
('/about', 'a1b2c3d4e5f60007', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'FR', strftime('%s','now') - 86400 * 2 + 5400),
('/about', 'a1b2c3d4e5f60009', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 5 + 5400),
('/about', 'a1b2c3d4e5f60012', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 8 + 10800),
('/about', 'a1b2c3d4e5f60016', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 15 + 14400),
('/about', 'a1b2c3d4e5f60020', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 25 + 7200),
('/about', 'a1b2c3d4e5f60023', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 40 + 10800),
('/about', 'a1b2c3d4e5f60026', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'FR', strftime('%s','now') - 86400 * 60 + 3600),
('/about', 'a1b2c3d4e5f60029', 'https://aleromano.com/', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 80 + 18000);

-- ── Blog listing page ───────────────────────────────────────────────────────

INSERT INTO analytics_visits (path, visitor_hash, referer, user_agent, country, created_at) VALUES
('/blog', 'b1b2c3d4e5f60001', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 7200),
('/blog', 'b1b2c3d4e5f60002', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 1 + 10800),
('/blog', 'b1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 2 + 3600),
('/blog', 'b1b2c3d4e5f60004', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 3 + 14400),
('/blog', 'b1b2c3d4e5f60005', 'https://twitter.com', 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 5 + 18000),
('/blog', 'b1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 8 + 7200),
('/blog', 'b1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'FR', strftime('%s','now') - 86400 * 12 + 21600),
('/blog', 'b1b2c3d4e5f60008', 'https://aleromano.com/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 20 + 10800),
('/blog', 'b1b2c3d4e5f60009', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 35 + 3600),
('/blog', 'b1b2c3d4e5f60010', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 50 + 14400),
('/blog', 'b1b2c3d4e5f60011', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 65 + 7200),
('/blog', 'b1b2c3d4e5f60012', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 80 + 18000);

-- ── Blog posts (English) — most popular ─────────────────────────────────────

INSERT INTO analytics_visits (path, visitor_hash, referer, user_agent, country, created_at) VALUES
-- high-agency-ai-philosophy (viral post, most traffic)
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 3600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60002', 'https://twitter.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 0 + 7200),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60003', 'https://linkedin.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 0 + 14400),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 0 + 21600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60005', 'https://hackernews.com', 'Mozilla/5.0 (Linux; Android 14)', 'US', strftime('%s','now') - 86400 * 1 + 3600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60006', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'GB', strftime('%s','now') - 86400 * 1 + 10800),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60007', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 1 + 18000),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60008', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'FR', strftime('%s','now') - 86400 * 2 + 7200),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60009', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 2 + 14400),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60010', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 3 + 3600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60011', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 3 + 21600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60012', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'ES', strftime('%s','now') - 86400 * 4 + 7200),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60013', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 5 + 10800),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60014', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'GB', strftime('%s','now') - 86400 * 6 + 3600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60015', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 7 + 14400),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60016', 'https://hackernews.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'NL', strftime('%s','now') - 86400 * 8 + 7200),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60017', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 10 + 18000),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60018', 'https://google.de', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'DE', strftime('%s','now') - 86400 * 12 + 3600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60019', 'https://google.com', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 15 + 10800),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60020', 'https://linkedin.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 18 + 21600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60021', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 22 + 7200),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60022', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'FR', strftime('%s','now') - 86400 * 30 + 14400),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60023', 'https://twitter.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 40 + 3600),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60024', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'JP', strftime('%s','now') - 86400 * 55 + 18000),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60025', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 70 + 10800),
('/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60026', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'US', strftime('%s','now') - 86400 * 85 + 7200),

-- improving-blog-with-claude (second most popular)
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 10800),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60002', 'https://twitter.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 1 + 7200),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 2 + 14400),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60004', 'https://linkedin.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 3 + 3600),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60005', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 4 + 18000),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 5 + 7200),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'FR', strftime('%s','now') - 86400 * 7 + 10800),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60008', 'https://hackernews.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 10 + 21600),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60009', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 14 + 3600),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60010', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 20 + 14400),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60011', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 30 + 7200),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60012', 'https://twitter.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'DE', strftime('%s','now') - 86400 * 45 + 10800),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60013', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 60 + 18000),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60014', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'GB', strftime('%s','now') - 86400 * 75 + 3600),
('/posts/improving-blog-with-claude', 'd1b2c3d4e5f60015', 'https://linkedin.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 88 + 14400),

-- the-boys-future-super-ai
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 14400),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60002', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 1 + 3600),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'US', strftime('%s','now') - 86400 * 2 + 18000),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 3 + 7200),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60005', 'https://twitter.com', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 5 + 10800),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'GB', strftime('%s','now') - 86400 * 8 + 21600),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'FR', strftime('%s','now') - 86400 * 12 + 3600),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60008', 'https://google.it', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 18 + 14400),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60009', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 28 + 7200),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60010', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 42 + 18000),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60011', 'https://google.com', 'Mozilla/5.0 (Linux; Android 14)', 'ES', strftime('%s','now') - 86400 * 60 + 10800),
('/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60012', 'https://twitter.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 80 + 3600),

-- effective-meetings-agenda
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 18000),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60002', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 2 + 7200),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'DE', strftime('%s','now') - 86400 * 5 + 14400),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 8 + 3600),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60005', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'GB', strftime('%s','now') - 86400 * 15 + 10800),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 25 + 21600),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'FR', strftime('%s','now') - 86400 * 40 + 7200),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60008', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 55 + 14400),
('/posts/effective-meetings-agenda', 'f1b2c3d4e5f60009', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 75 + 3600),

-- git-commits-why
('/posts/git-commits-why', 'g1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 1 + 10800),
('/posts/git-commits-why', 'g1b2c3d4e5f60002', 'https://hackernews.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 3 + 7200),
('/posts/git-commits-why', 'g1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'DE', strftime('%s','now') - 86400 * 6 + 3600),
('/posts/git-commits-why', 'g1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 10 + 18000),
('/posts/git-commits-why', 'g1b2c3d4e5f60005', 'https://google.com', 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 15 + 14400),
('/posts/git-commits-why', 'g1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 25 + 7200),
('/posts/git-commits-why', 'g1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'US', strftime('%s','now') - 86400 * 45 + 10800),
('/posts/git-commits-why', 'g1b2c3d4e5f60008', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 70 + 3600),

-- 3-career-tips
('/posts/3-career-tips', 'h1b2c3d4e5f60001', 'https://linkedin.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 21600),
('/posts/3-career-tips', 'h1b2c3d4e5f60002', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 3 + 10800),
('/posts/3-career-tips', 'h1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 7 + 7200),
('/posts/3-career-tips', 'h1b2c3d4e5f60004', 'https://linkedin.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 14 + 3600),
('/posts/3-career-tips', 'h1b2c3d4e5f60005', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 25 + 14400),
('/posts/3-career-tips', 'h1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 40 + 18000),
('/posts/3-career-tips', 'h1b2c3d4e5f60007', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 60 + 10800),

-- emotional-component-software-release
('/posts/emotional-component-software-release', 'i1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 2 + 7200),
('/posts/emotional-component-software-release', 'i1b2c3d4e5f60002', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 8 + 14400),
('/posts/emotional-component-software-release', 'i1b2c3d4e5f60003', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'DE', strftime('%s','now') - 86400 * 18 + 3600),
('/posts/emotional-component-software-release', 'i1b2c3d4e5f60004', 'https://twitter.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 35 + 10800),
('/posts/emotional-component-software-release', 'i1b2c3d4e5f60005', 'https://google.com', 'Mozilla/5.0 (Linux; Android 14)', 'FR', strftime('%s','now') - 86400 * 55 + 21600),
('/posts/emotional-component-software-release', 'i1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 78 + 7200),

-- about-this-site
('/posts/about-this-site', 'j1b2c3d4e5f60001', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 1 + 14400),
('/posts/about-this-site', 'j1b2c3d4e5f60002', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 5 + 7200),
('/posts/about-this-site', 'j1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 12 + 3600),
('/posts/about-this-site', 'j1b2c3d4e5f60004', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'GB', strftime('%s','now') - 86400 * 22 + 18000),
('/posts/about-this-site', 'j1b2c3d4e5f60005', 'https://google.com', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 40 + 10800),

-- manage-parent-code-ai
('/posts/manage-parent-code-ai', 'k1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 7200),
('/posts/manage-parent-code-ai', 'k1b2c3d4e5f60002', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 4 + 14400),
('/posts/manage-parent-code-ai', 'k1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'DE', strftime('%s','now') - 86400 * 10 + 3600),
('/posts/manage-parent-code-ai', 'k1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 20 + 10800),
('/posts/manage-parent-code-ai', 'k1b2c3d4e5f60005', 'https://twitter.com', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 50 + 21600),

-- azure-schema-registry-upgrade (technical niche)
('/posts/azure-schema-registry-upgrade', 'l1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 3 + 10800),
('/posts/azure-schema-registry-upgrade', 'l1b2c3d4e5f60002', 'https://stackoverflow.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 12 + 7200),
('/posts/azure-schema-registry-upgrade', 'l1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 30 + 14400),
('/posts/azure-schema-registry-upgrade', 'l1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 55 + 3600),

-- home-office-renovation (lifestyle, moderate traffic)
('/posts/home-office-renovation', 'm1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 1 + 10800),
('/posts/home-office-renovation', 'm1b2c3d4e5f60002', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 6 + 14400),
('/posts/home-office-renovation', 'm1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 15 + 7200),
('/posts/home-office-renovation', 'm1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'DE', strftime('%s','now') - 86400 * 30 + 3600),
('/posts/home-office-renovation', 'm1b2c3d4e5f60005', 'https://google.it', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 50 + 21600),

-- yagni-for-business
('/posts/yagni-for-business', 'n1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 2 + 3600),
('/posts/yagni-for-business', 'n1b2c3d4e5f60002', 'https://hackernews.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 10 + 14400),
('/posts/yagni-for-business', 'n1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'GB', strftime('%s','now') - 86400 * 22 + 7200),
('/posts/yagni-for-business', 'n1b2c3d4e5f60004', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 45 + 10800),

-- mac-to-windows (low traffic, older)
('/posts/mac-to-windows', 'o1b2c3d4e5f60001', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 5 + 18000),
('/posts/mac-to-windows', 'o1b2c3d4e5f60002', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 20 + 7200),
('/posts/mac-to-windows', 'o1b2c3d4e5f60003', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'DE', strftime('%s','now') - 86400 * 50 + 3600);

-- ── Blog posts (Italian) ────────────────────────────────────────────────────

INSERT INTO analytics_visits (path, visitor_hash, referer, user_agent, country, created_at) VALUES
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60001', 'https://google.it', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 10800),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60002', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 1 + 7200),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60003', 'https://google.it', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 3 + 14400),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60004', 'https://linkedin.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 5 + 3600),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60005', 'https://google.it', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 10 + 18000),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60006', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 20 + 10800),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60007', 'https://google.it', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 35 + 7200),
('/posts/it/high-agency-ai-philosophy', 'p1b2c3d4e5f60008', 'https://twitter.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 55 + 14400),
('/posts/it/the-boys-future-super-ai', 'q1b2c3d4e5f60001', 'https://google.it', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 3600),
('/posts/it/the-boys-future-super-ai', 'q1b2c3d4e5f60002', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 2 + 10800),
('/posts/it/the-boys-future-super-ai', 'q1b2c3d4e5f60003', 'https://linkedin.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 5 + 7200),
('/posts/it/the-boys-future-super-ai', 'q1b2c3d4e5f60004', 'https://google.it', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 12 + 14400),
('/posts/it/the-boys-future-super-ai', 'q1b2c3d4e5f60005', NULL, 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 28 + 3600),
('/posts/it/improving-blog-with-claude', 'r1b2c3d4e5f60001', 'https://google.it', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 1 + 14400),
('/posts/it/improving-blog-with-claude', 'r1b2c3d4e5f60002', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'IT', strftime('%s','now') - 86400 * 8 + 7200),
('/posts/it/improving-blog-with-claude', 'r1b2c3d4e5f60003', 'https://google.it', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'IT', strftime('%s','now') - 86400 * 20 + 10800),
('/posts/it/improving-blog-with-claude', 'r1b2c3d4e5f60004', 'https://twitter.com', 'Mozilla/5.0 (Linux; Android 14)', 'IT', strftime('%s','now') - 86400 * 45 + 3600),

-- ── Contact page ────────────────────────────────────────────────────────────
('/contact', 's1b2c3d4e5f60001', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 0 + 14400),
('/contact', 's1b2c3d4e5f60002', 'https://aleromano.com/about', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'US', strftime('%s','now') - 86400 * 3 + 7200),
('/contact', 's1b2c3d4e5f60003', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'DE', strftime('%s','now') - 86400 * 10 + 3600),
('/contact', 's1b2c3d4e5f60004', 'https://aleromano.com/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'IT', strftime('%s','now') - 86400 * 25 + 18000),
('/contact', 's1b2c3d4e5f60005', 'https://linkedin.com', 'Mozilla/5.0 (Linux; Android 14)', 'GB', strftime('%s','now') - 86400 * 50 + 10800);

-- ============================================================================
-- Click events: realistic link/button clicks across the site
-- ============================================================================

INSERT INTO analytics_events (type, path, visitor_hash, element_tag, element_id, element_text, href, duration, created_at) VALUES
-- Navigation clicks
('click', '/', 'a1b2c3d4e5f60001', 'a', 'nav-blog', 'Blog', '/blog', NULL, strftime('%s','now') - 86400 * 0 + 3660),
('click', '/', 'a1b2c3d4e5f60002', 'a', 'nav-about', 'About', '/about', NULL, strftime('%s','now') - 86400 * 0 + 7260),
('click', '/', 'a1b2c3d4e5f60004', 'a', 'nav-contact', 'Contact', '/contact', NULL, strftime('%s','now') - 86400 * 1 + 3660),
('click', '/blog', 'b1b2c3d4e5f60001', 'a', NULL, 'High Agency & AI Philosophy', '/posts/high-agency-ai-philosophy', NULL, strftime('%s','now') - 86400 * 0 + 7260),
('click', '/blog', 'b1b2c3d4e5f60002', 'a', NULL, 'Improving Blog with Claude', '/posts/improving-blog-with-claude', NULL, strftime('%s','now') - 86400 * 1 + 10860),
('click', '/blog', 'b1b2c3d4e5f60003', 'a', NULL, 'The Boys Future Super AI', '/posts/the-boys-future-super-ai', NULL, strftime('%s','now') - 86400 * 2 + 3660),
('click', '/blog', 'b1b2c3d4e5f60004', 'a', NULL, 'Effective Meetings Agenda', '/posts/effective-meetings-agenda', NULL, strftime('%s','now') - 86400 * 3 + 14460),
('click', '/blog', 'b1b2c3d4e5f60005', 'a', NULL, 'Git Commits: Why?', '/posts/git-commits-why', NULL, strftime('%s','now') - 86400 * 5 + 18060),
('click', '/blog', 'b1b2c3d4e5f60006', 'a', NULL, '3 Career Tips', '/posts/3-career-tips', NULL, strftime('%s','now') - 86400 * 8 + 7260),
-- Social link clicks
('click', '/about', 'a1b2c3d4e5f60001', 'a', 'social-github', 'GitHub', 'https://github.com/aleromano92', NULL, strftime('%s','now') - 86400 * 0 + 5500),
('click', '/about', 'a1b2c3d4e5f60004', 'a', 'social-linkedin', 'LinkedIn', 'https://linkedin.com/in/aleromano', NULL, strftime('%s','now') - 86400 * 1 + 5500),
('click', '/about', 'a1b2c3d4e5f60009', 'a', 'social-twitter', 'X / Twitter', 'https://twitter.com/AleRomano92', NULL, strftime('%s','now') - 86400 * 5 + 5500),
('click', '/', 'a1b2c3d4e5f60011', 'a', 'social-github', 'GitHub', 'https://github.com/aleromano92', NULL, strftime('%s','now') - 86400 * 4 + 10860),
-- Theme switcher clicks
('click', '/', 'a1b2c3d4e5f60003', 'button', 'theme-toggle', '🌙', NULL, NULL, strftime('%s','now') - 86400 * 0 + 10860),
('click', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60002', 'button', 'theme-toggle', '☀️', NULL, NULL, strftime('%s','now') - 86400 * 0 + 7260),
('click', '/blog', 'b1b2c3d4e5f60007', 'button', 'theme-toggle', '🌙', NULL, NULL, strftime('%s','now') - 86400 * 12 + 21660),
-- Language switcher clicks
('click', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60001', 'a', 'lang-switch', 'IT', '/posts/it/high-agency-ai-philosophy', NULL, strftime('%s','now') - 86400 * 0 + 3660),
('click', '/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60002', 'a', 'lang-switch', 'IT', '/posts/it/the-boys-future-super-ai', NULL, strftime('%s','now') - 86400 * 1 + 3660),
-- External link clicks from blog posts
('click', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60005', 'a', NULL, 'Dario Amodei essay', 'https://darioamodei.com/machines-of-loving-grace', NULL, strftime('%s','now') - 86400 * 1 + 3660),
('click', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60001', 'a', NULL, 'Claude', 'https://claude.ai', NULL, strftime('%s','now') - 86400 * 0 + 10860),
('click', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60002', 'a', NULL, 'Astro', 'https://astro.build', NULL, strftime('%s','now') - 86400 * 1 + 7260),
('click', '/posts/git-commits-why', 'g1b2c3d4e5f60001', 'a', NULL, 'Conventional Commits', 'https://www.conventionalcommits.org', NULL, strftime('%s','now') - 86400 * 1 + 10860),
-- "Not a Cookie Banner" clicks
('click', '/', 'a1b2c3d4e5f60006', 'button', 'cookie-accept', 'I understand', NULL, NULL, strftime('%s','now') - 86400 * 1 + 28860),
('click', '/blog', 'b1b2c3d4e5f60001', 'button', 'cookie-accept', 'I understand', NULL, NULL, strftime('%s','now') - 86400 * 0 + 7260),
('click', '/about', 'a1b2c3d4e5f60007', 'button', 'cookie-accept', 'I understand', NULL, NULL, strftime('%s','now') - 86400 * 2 + 5560),
-- RSS link click
('click', '/', 'a1b2c3d4e5f60008', 'a', NULL, 'RSS Feed', '/rss.xml', NULL, strftime('%s','now') - 86400 * 2 + 18060);

-- ============================================================================
-- Time on page events: realistic reading durations
-- ============================================================================

INSERT INTO analytics_events (type, path, visitor_hash, element_tag, element_id, element_text, href, duration, created_at) VALUES
-- Blog posts get longer reading times (articles: 2-8 minutes)
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 342000, strftime('%s','now') - 86400 * 0 + 3900),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 285000, strftime('%s','now') - 86400 * 0 + 7500),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 420000, strftime('%s','now') - 86400 * 0 + 14700),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60004', NULL, NULL, NULL, NULL, 198000, strftime('%s','now') - 86400 * 0 + 21900),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60005', NULL, NULL, NULL, NULL, 510000, strftime('%s','now') - 86400 * 1 + 3900),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60006', NULL, NULL, NULL, NULL, 270000, strftime('%s','now') - 86400 * 1 + 11100),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60007', NULL, NULL, NULL, NULL, 156000, strftime('%s','now') - 86400 * 1 + 18300),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60008', NULL, NULL, NULL, NULL, 390000, strftime('%s','now') - 86400 * 2 + 7500),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60009', NULL, NULL, NULL, NULL, 245000, strftime('%s','now') - 86400 * 2 + 14700),
('time_on_page', '/posts/high-agency-ai-philosophy', 'c1b2c3d4e5f60010', NULL, NULL, NULL, NULL, 480000, strftime('%s','now') - 86400 * 3 + 3300),
('time_on_page', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 264000, strftime('%s','now') - 86400 * 0 + 11100),
('time_on_page', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 318000, strftime('%s','now') - 86400 * 1 + 7500),
('time_on_page', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 192000, strftime('%s','now') - 86400 * 2 + 14700),
('time_on_page', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60004', NULL, NULL, NULL, NULL, 450000, strftime('%s','now') - 86400 * 3 + 3300),
('time_on_page', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60005', NULL, NULL, NULL, NULL, 228000, strftime('%s','now') - 86400 * 4 + 18300),
('time_on_page', '/posts/improving-blog-with-claude', 'd1b2c3d4e5f60006', NULL, NULL, NULL, NULL, 378000, strftime('%s','now') - 86400 * 5 + 7500),
('time_on_page', '/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 306000, strftime('%s','now') - 86400 * 0 + 14700),
('time_on_page', '/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 240000, strftime('%s','now') - 86400 * 1 + 3300),
('time_on_page', '/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 420000, strftime('%s','now') - 86400 * 2 + 18300),
('time_on_page', '/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60004', NULL, NULL, NULL, NULL, 174000, strftime('%s','now') - 86400 * 3 + 7500),
('time_on_page', '/posts/the-boys-future-super-ai', 'e1b2c3d4e5f60005', NULL, NULL, NULL, NULL, 348000, strftime('%s','now') - 86400 * 5 + 11100),
('time_on_page', '/posts/effective-meetings-agenda', 'f1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 210000, strftime('%s','now') - 86400 * 0 + 18300),
('time_on_page', '/posts/effective-meetings-agenda', 'f1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 276000, strftime('%s','now') - 86400 * 2 + 7500),
('time_on_page', '/posts/effective-meetings-agenda', 'f1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 330000, strftime('%s','now') - 86400 * 5 + 14700),
('time_on_page', '/posts/effective-meetings-agenda', 'f1b2c3d4e5f60004', NULL, NULL, NULL, NULL, 186000, strftime('%s','now') - 86400 * 8 + 3300),
('time_on_page', '/posts/git-commits-why', 'g1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 234000, strftime('%s','now') - 86400 * 1 + 11100),
('time_on_page', '/posts/git-commits-why', 'g1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 294000, strftime('%s','now') - 86400 * 3 + 7500),
('time_on_page', '/posts/git-commits-why', 'g1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 162000, strftime('%s','now') - 86400 * 6 + 3300),
('time_on_page', '/posts/3-career-tips', 'h1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 258000, strftime('%s','now') - 86400 * 0 + 21900),
('time_on_page', '/posts/3-career-tips', 'h1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 312000, strftime('%s','now') - 86400 * 3 + 11100),
('time_on_page', '/posts/3-career-tips', 'h1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 198000, strftime('%s','now') - 86400 * 7 + 7500),
('time_on_page', '/posts/manage-parent-code-ai', 'k1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 222000, strftime('%s','now') - 86400 * 0 + 7500),
('time_on_page', '/posts/manage-parent-code-ai', 'k1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 360000, strftime('%s','now') - 86400 * 4 + 14700),
('time_on_page', '/posts/manage-parent-code-ai', 'k1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 186000, strftime('%s','now') - 86400 * 10 + 3300),
-- Short reading times for non-article pages (about, home: 15-60 seconds)
('time_on_page', '/', 'a1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 32000, strftime('%s','now') - 86400 * 0 + 3900),
('time_on_page', '/', 'a1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 45000, strftime('%s','now') - 86400 * 0 + 7500),
('time_on_page', '/', 'a1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 18000, strftime('%s','now') - 86400 * 0 + 11100),
('time_on_page', '/', 'a1b2c3d4e5f60004', NULL, NULL, NULL, NULL, 55000, strftime('%s','now') - 86400 * 1 + 3900),
('time_on_page', '/', 'a1b2c3d4e5f60005', NULL, NULL, NULL, NULL, 27000, strftime('%s','now') - 86400 * 1 + 14700),
('time_on_page', '/about', 'a1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 65000, strftime('%s','now') - 86400 * 0 + 5700),
('time_on_page', '/about', 'a1b2c3d4e5f60004', NULL, NULL, NULL, NULL, 42000, strftime('%s','now') - 86400 * 1 + 5700),
('time_on_page', '/about', 'a1b2c3d4e5f60007', NULL, NULL, NULL, NULL, 78000, strftime('%s','now') - 86400 * 2 + 5700),
('time_on_page', '/about', 'a1b2c3d4e5f60009', NULL, NULL, NULL, NULL, 35000, strftime('%s','now') - 86400 * 5 + 5700),
('time_on_page', '/blog', 'b1b2c3d4e5f60001', NULL, NULL, NULL, NULL, 22000, strftime('%s','now') - 86400 * 0 + 7500),
('time_on_page', '/blog', 'b1b2c3d4e5f60002', NULL, NULL, NULL, NULL, 38000, strftime('%s','now') - 86400 * 1 + 11100),
('time_on_page', '/blog', 'b1b2c3d4e5f60003', NULL, NULL, NULL, NULL, 15000, strftime('%s','now') - 86400 * 2 + 3900);
