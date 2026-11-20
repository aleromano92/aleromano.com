# The X feed is frozen as a tombstone

X ended free API access in favour of pay-per-use pricing, so the live "Latest from X" section
became a frozen **tombstone**. A one-off GraphQL timeline export (`20260710-tweets.json`) is
parsed into the same `TwitterPost` shape the view already renders.

## Decisions

- **Dates are frozen to absolute labels**, because the feed will never update again.
- **Media is mirrored into `/public/tombstone-tweets/`**, because `pbs.twimg.com` URLs rotate.
  Media hosted elsewhere is dropped.
- **The pages that show it (`/about`, `/it/about`) are prerendered**: nothing is computed per
  request any more.
- The tombstone's "how caching saved us" snippet is a faithful condensation of the
  stale-fallback path in `src/utils/twitter/twitter.ts`. The 402 it catches is what the
  pay-per-use API returns.
