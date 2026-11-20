import type { TwitterPost } from './twitter-view-adapter';
import tweetsExport from './20260710-tweets.json';

const AUTHOR_NAME = 'Alessandro Romano';
const AUTHOR_USERNAME = '_aleromano';

const REMOTE_MEDIA_PREFIX = 'https://pbs.twimg.com/media/';
const LOCAL_MEDIA_PREFIX = '/tombstone-tweets/';

function stripTrailingTco(text: string): string {
  return text.replace(/\s*https:\/\/t\.co\/\w+\s*$/, '').trim();
}

function formatFrozenDate(date: Date, lang: string): string {
  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

function toLocalMediaUrl(remoteUrl: string): string | null {
  if (!remoteUrl.startsWith(REMOTE_MEDIA_PREFIX)) return null;
  return remoteUrl.replace(REMOTE_MEDIA_PREFIX, LOCAL_MEDIA_PREFIX);
}

function unwrapTweetResult(result: any): any | null {
  if (!result) return null;
  return result.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;
}

function tweetResultFromEntry(entry: any): any | null {
  return unwrapTweetResult(entry?.content?.itemContent?.tweet_results?.result);
}

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

export function getTombstoneTweets(language: string = 'en', limit: number = 6): TwitterPost[] {
  return collectTweetResults()
    .map((result) => toPost(result, language))
    .filter((post): post is TwitterPost => post !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
