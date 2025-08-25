export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  url: string;
  repo: string;
  formattedDate: string;
  truncatedMessage: string;
  relativeTime: string;
}

export interface GitHubCommitsData {
  commits: GitHubCommit[];
  error?: string;
}

const GITHUB_USERNAME = 'aleromano92';
const GITHUB_REPO = 'aleromano.com';
const PERSONAL_GITHUB_TOKEN = import.meta.env.PERSONAL_GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN;

function formatDate(dateString: string, lang: string = 'en'): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome', // Convert UTC to Rome timezone (UTC+1/+2)
  };

  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', options);
}

function getRelativeTime(dateString: string, language: string = 'en'): string {
  const now = new Date();
  const commitDate = new Date(dateString);
  const diffInMs = now.getTime() - commitDate.getTime();
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  // Translation map for relative time strings
  const translations = {
    en: {
      now: 'now',
      minute: { singular: '1 minute ago', plural: (n: number) => `${n} minutes ago` },
      hour: { singular: '1 hour ago', plural: (n: number) => `${n} hours ago` },
      day: { singular: '1 day ago', plural: (n: number) => `${n} days ago` },
      week: { singular: '1 week ago', plural: (n: number) => `${n} weeks ago` },
      month: { singular: '1 month ago', plural: (n: number) => `${n} months ago` },
      year: { singular: '1 year ago', plural: (n: number) => `${n} years ago` }
    },
    it: {
      now: 'adesso',
      minute: { singular: '1 minuto fa', plural: (n: number) => `${n} minuti fa` },
      hour: { singular: '1 ora fa', plural: (n: number) => `${n} ore fa` },
      day: { singular: '1 giorno fa', plural: (n: number) => `${n} giorni fa` },
      week: { singular: '1 settimana fa', plural: (n: number) => `${n} settimane fa` },
      month: { singular: '1 mese fa', plural: (n: number) => `${n} mesi fa` },
      year: { singular: '1 anno fa', plural: (n: number) => `${n} anni fa` }
    }
  };

  type Translations = typeof translations;

  const t = translations[language as keyof Translations];

  // Determine the time unit and value using pattern matching
  let timeUnit: string;
  let value: number;

  switch (true) {
    case diffInMs < minute:
      return t.now;
    
    case diffInMs < hour:
      timeUnit = 'minute';
      value = Math.floor(diffInMs / minute);
      break;
    
    case diffInMs < day:
      timeUnit = 'hour';
      value = Math.floor(diffInMs / hour);
      break;
    
    case diffInMs < week:
      timeUnit = 'day';
      value = Math.floor(diffInMs / day);
      break;
    
    case diffInMs < month:
      timeUnit = 'week';
      value = Math.floor(diffInMs / week);
      break;
    
    case diffInMs < year:
      timeUnit = 'month';
      value = Math.floor(diffInMs / month);
      break;
    
    default:
      timeUnit = 'year';
      value = Math.floor(diffInMs / year);
      break;
  }

  // Return singular or plural form based on value
  const unitTranslation = t[timeUnit as keyof typeof t] as { singular: string; plural: (n: number) => string };
  return value === 1 ? unitTranslation.singular : unitTranslation.plural(value);
}

function truncateMessage(message: string, maxLength: number = 180): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

async function fetchRepositoryCommits(): Promise<any[]> {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits?per_page=9&author=${GITHUB_USERNAME}`;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'aleromano.com'
  };

  if (PERSONAL_GITHUB_TOKEN) {
    headers['Authorization'] = `token ${PERSONAL_GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    throw error;
  }
}

function extractCommitsFromRepositoryData(commits: any[], language: string = 'en'): GitHubCommit[] {
  const gitHubCommits: GitHubCommit[] = [];
  
  for (const commit of commits) {
    // Skip merge commits
    if (!commit.commit.message.startsWith('Merge')) {
      const message = commit.commit.message.split('\n')[0]; // First line only
      const date = commit.commit.author.date;
      
      gitHubCommits.push({
        sha: commit.sha.substring(0, 7), // Short SHA
        message,
        date,
        url: commit.html_url,
        repo: `${GITHUB_USERNAME}/${GITHUB_REPO}`,
        formattedDate: formatDate(date, language),
        truncatedMessage: truncateMessage(message),
        relativeTime: getRelativeTime(date, language)
      });
    }
  }
  
  // Sort by date descending
  return gitHubCommits
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getGitHubCommitsData(language: string = 'en'): Promise<GitHubCommitsData> {
  try {
    const commits = await fetchRepositoryCommits();
    const gitHubCommits = extractCommitsFromRepositoryData(commits, language);
    
    return {
      commits: gitHubCommits
    };
  } catch (error) {
    console.error('Failed to fetch GitHub commits:', error);
    
    return {
      commits: [],
      error: 'Failed to load recent commits'
    };
  }
}