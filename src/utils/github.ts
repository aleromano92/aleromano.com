export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  url: string;
  repo: string;
  formattedDate: string;
  truncatedMessage: string;
}

export interface GitHubCommitsData {
  commits: GitHubCommit[];
  error?: string;
}

const GITHUB_USERNAME = 'aleromano92';
const GITHUB_REPO = 'aleromano.com';
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

function formatDate(dateString: string, lang: string = 'en'): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', options);
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

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
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
        truncatedMessage: truncateMessage(message)
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