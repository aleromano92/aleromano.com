import { describe, it, expect, vi } from 'vitest';
import { getTombstoneTweets } from './tombstone';

// Replace the huge frozen GraphQL export with a small fixture that covers
// every entry shape the parser must handle: a pinned entry, a visibility-wrapped
// tweet, cursor entries, empty results and a tweet missing mandatory fields.
vi.mock('./20260710-tweets.json', () => {
  const pinnedTweet = {
    __typename: 'Tweet',
    core: {
      user_results: {
        result: { core: { screen_name: '_aleromano', name: 'Alessandro Romano' } },
      },
    },
    legacy: {
      id_str: '100',
      created_at: 'Mon Mar 02 09:30:00 +0000 2026',
      full_text: 'Pinned with media https://t.co/abc123',
      retweet_count: 5,
      favorite_count: 10,
      reply_count: 2,
      extended_entities: {
        media: [
          {
            type: 'photo',
            media_url_https: 'https://pbs.twimg.com/media/AAA.jpg',
            ext_alt_text: 'A chart',
            original_info: { width: 800, height: 600 },
          },
          // not a photo: must be filtered out
          { type: 'video', media_url_https: 'https://pbs.twimg.com/media/BBB.jpg' },
          // not hosted on pbs.twimg.com: cannot be mirrored locally, dropped
          { type: 'photo', media_url_https: 'https://elsewhere.example/CCC.jpg' },
        ],
      },
    },
  };

  const wrappedNewestTweet = {
    __typename: 'TweetWithVisibilityResults',
    tweet: {
      core: {
        user_results: {
          result: { core: { screen_name: '_aleromano', name: 'Alessandro Romano' } },
        },
      },
      legacy: {
        id_str: '300',
        created_at: 'Fri Jul 10 12:00:00 +0000 2026',
        full_text: 'Newest tweet',
        retweet_count: 1,
        favorite_count: 3,
        reply_count: 0,
      },
    },
  };

  // No user info and no metrics: exercises the author/metrics fallbacks.
  const oldestTweet = {
    __typename: 'Tweet',
    legacy: {
      id_str: '200',
      created_at: 'Sat Oct 11 12:00:00 +0000 2025',
      full_text: 'Oldest tweet',
      extended_entities: {
        media: [{ type: 'photo', media_url_https: 'https://pbs.twimg.com/media/DDD.jpg' }],
      },
    },
  };

  const entry = (entryId: string, result: unknown) => ({
    entryId,
    content: { itemContent: { tweet_results: result === undefined ? {} : { result } } },
  });

  return {
    default: {
      data: {
        user: {
          result: {
            timeline: {
              timeline: {
                instructions: [
                  { type: 'TimelineClearCache' },
                  { type: 'TimelinePinEntry', entry: entry('tweet-100', pinnedTweet) },
                  {
                    type: 'TimelineAddEntries',
                    entries: [
                      entry('tweet-300', wrappedNewestTweet),
                      entry('tweet-200', oldestTweet),
                      entry('cursor-bottom-1', undefined),
                      entry('tweet-999', undefined),
                      entry('tweet-888', { legacy: { full_text: 'missing id and date' } }),
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
});

describe('getTombstoneTweets', () => {
  it('collects pinned and timeline tweets, sorted newest first', () => {
    const posts = getTombstoneTweets();

    expect(posts.map((p) => p.id)).toEqual(['300', '100', '200']);
  });

  it('skips cursor entries, empty results and tweets missing mandatory fields', () => {
    const posts = getTombstoneTweets();

    expect(posts).toHaveLength(3);
    expect(posts.map((p) => p.id)).not.toContain('888');
  });

  it('unwraps TweetWithVisibilityResults wrappers', () => {
    const [newest] = getTombstoneTweets();

    expect(newest.id).toBe('300');
    expect(newest.text).toBe('Newest tweet');
  });

  it('respects the limit parameter', () => {
    expect(getTombstoneTweets('en', 2).map((p) => p.id)).toEqual(['300', '100']);
  });

  it('strips the trailing t.co link from the tweet text', () => {
    const pinned = getTombstoneTweets().find((p) => p.id === '100');

    expect(pinned?.text).toBe('Pinned with media');
  });

  it('maps pbs.twimg.com media to local mirrored copies and drops non-photo or foreign media', () => {
    const pinned = getTombstoneTweets().find((p) => p.id === '100');

    expect(pinned?.media).toEqual([
      {
        type: 'photo',
        url: '/tombstone-tweets/AAA.jpg',
        alt_text: 'A chart',
        width: 800,
        height: 600,
      },
    ]);
  });

  it('falls back to a generic alt text and omits dimensions when missing', () => {
    const oldest = getTombstoneTweets().find((p) => p.id === '200');

    expect(oldest?.media).toEqual([
      {
        type: 'photo',
        url: '/tombstone-tweets/DDD.jpg',
        alt_text: 'Image from tweet',
        width: undefined,
        height: undefined,
      },
    ]);
  });

  it('leaves media undefined for tweets without photos', () => {
    const newest = getTombstoneTweets().find((p) => p.id === '300');

    expect(newest?.media).toBeUndefined();
  });

  it('falls back to the site author when user info is missing', () => {
    const oldest = getTombstoneTweets().find((p) => p.id === '200');

    expect(oldest?.author_name).toBe('Alessandro Romano');
    expect(oldest?.author_username).toBe('_aleromano');
    expect(oldest?.url).toBe('https://x.com/_aleromano/status/200');
  });

  it('defaults public metrics to zero when counts are missing', () => {
    const oldest = getTombstoneTweets().find((p) => p.id === '200');

    expect(oldest?.public_metrics).toEqual({ retweet_count: 0, like_count: 0, reply_count: 0 });
  });

  it('keeps real engagement counts when present', () => {
    const pinned = getTombstoneTweets().find((p) => p.id === '100');

    expect(pinned?.public_metrics).toEqual({ retweet_count: 5, like_count: 10, reply_count: 2 });
  });

  it('formats frozen dates in English by default', () => {
    const [newest] = getTombstoneTweets();

    expect(newest.relativeTime).toBe('Jul 10, 2026');
    expect(newest.formattedDate).toBe('Jul 10, 2026, 02:00 PM');
    expect(newest.created_at).toBe('2026-07-10T12:00:00.000Z');
  });

  it('formats frozen dates in Italian when requested', () => {
    const [newest] = getTombstoneTweets('it');

    expect(newest.relativeTime).toBe('10 lug 2026');
    expect(newest.formattedDate).toBe('10 lug 2026, 14:00');
  });
});
