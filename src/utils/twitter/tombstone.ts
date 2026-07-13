/**
 * Twitter Tombstone Parser
 *
 * X (Twitter) shut down free API access in favour of pay-per-use pricing
 * (https://devcommunity.x.com/t/announcing-the-launch-of-x-api-pay-per-use-pricing/256476),
 * so the once-live "Latest from X" section is now a frozen tombstone.
 *
 * This module reads a one-off GraphQL timeline export (`20260710-tweets.json`) and turns
 * the most recent tweets into the same `TwitterPost` shape the view layer already
 * knows how to render. Unlike the live adapter, dates are frozen to an absolute
 * label (the feed will never update again) and media points at locally hosted
 * copies under `/tombstone-tweets/` so the section keeps rendering even if X's CDN
 * rotates the original URLs.
 */
import type { TwitterPost } from './twitter-view-adapter';
import tweetsExport from './20260710-tweets.json';

const AUTHOR_NAME = 'Alessandro Romano';
const AUTHOR_USERNAME = '_aleromano';

// pbs.twimg.com URLs are fragile; we mirror the images we need into /public.
const REMOTE_MEDIA_PREFIX = 'https://pbs.twimg.com/media/';
const LOCAL_MEDIA_PREFIX = '/tombstone-tweets/';

/**
 * Remove the trailing t.co link X appends when a tweet carries media or a quote,
 * mirroring the behaviour of the live view adapter.
 */
function stripTrailingTco(text: string): string {
  return text.replace(/\s*https:\/\/t\.co\/\w+\s*$/, '').trim();
}

/** Absolute, frozen "day" label shown in place of the live relative time. */
function formatFrozenDate(date: Date, lang: string): string {
  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Full timestamp used as the `<time>` tooltip. */
function formatFullDate(date: Date, lang: string): string {
  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

/** Map a remote pbs.twimg.com media URL to its locally mirrored copy. */
function toLocalMediaUrl(remoteUrl: string): string | null {
  if (!remoteUrl.startsWith(REMOTE_MEDIA_PREFIX)) return null;
  return remoteUrl.replace(REMOTE_MEDIA_PREFIX, LOCAL_MEDIA_PREFIX);
}

/** Unwrap the tweet result, which may be wrapped for visibility reasons. */
function unwrapTweetResult(result: any): any | null {
  if (!result) return null;
  return result.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;
}

/** Pull the tweet result out of a timeline entry, whatever its position. */
function tweetResultFromEntry(entry: any): any | null {
  return unwrapTweetResult(entry?.content?.itemContent?.tweet_results?.result);
}

/** Walk the GraphQL export and collect every tweet result (pinned + timeline). */
function collectTweetResults(): any[] {
  const instructions: any[] =
    (tweetsExport as any)?.data?.user?.result?.timeline?.timeline?.instructions ?? [];

  const results: any[] = [];
  for (const instruction of instructions) {
    if (instruction?.type === 'TimelinePinEntry' && instruction.entry) {
      const result = tweetResultFromEntry(instruction.entry);
      if (result) results.push(result);
    }
    if (instruction?.type === 'TimelineAddEntries' && Array.isArray(instruction.entries)) {
      for (const entry of instruction.entries) {
        if (typeof entry?.entryId === 'string' && entry.entryId.startsWith('tweet-')) {
          const result = tweetResultFromEntry(entry);
          if (result) results.push(result);
        }
      }
    }
  }
  return results;
}

/** Convert a raw GraphQL tweet result into our view-layer `TwitterPost`. */
function toPost(result: any, lang: string): TwitterPost | null {
  const legacy = result?.legacy;
  if (!legacy?.created_at || !legacy?.id_str) return null;

  const createdAt = new Date(legacy.created_at);
  const user = result?.core?.user_results?.result?.core;
  const username = user?.screen_name ?? AUTHOR_USERNAME;
  const name = user?.name ?? AUTHOR_NAME;

  const media = (legacy?.extended_entities?.media ?? [])
    .filter((item: any) => item?.type === 'photo' && typeof item?.media_url_https === 'string')
    .map((item: any) => {
      const localUrl = toLocalMediaUrl(item.media_url_https);
      if (!localUrl) return null;
      return {
        type: 'photo' as const,
        url: localUrl,
        alt_text: item.ext_alt_text || 'Image from tweet',
        width: item.original_info?.width,
        height: item.original_info?.height,
      };
    })
    .filter(Boolean) as NonNullable<TwitterPost['media']>;

  return {
    id: legacy.id_str,
    text: stripTrailingTco(legacy.full_text ?? ''),
    created_at: createdAt.toISOString(),
    formattedDate: formatFullDate(createdAt, lang),
    relativeTime: formatFrozenDate(createdAt, lang),
    author_name: name,
    author_username: username,
    public_metrics: {
      retweet_count: legacy.retweet_count ?? 0,
      like_count: legacy.favorite_count ?? 0,
      reply_count: legacy.reply_count ?? 0,
    },
    url: `https://x.com/${username}/status/${legacy.id_str}`,
    media: media.length > 0 ? media : undefined,
  };
}

/**
 * Return the most recent tweets from the frozen export, newest first.
 * @param language - 'en' or 'it' for date localisation
 * @param limit - how many tweets to return (defaults to 6)
 */
export function getTombstoneTweets(language: string = 'en', limit: number = 6): TwitterPost[] {
  return collectTweetResults()
    .map((result) => toPost(result, language))
    .filter((post): post is TwitterPost => post !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
