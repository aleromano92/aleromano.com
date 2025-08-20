export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  url: string;
  repo: string;
}

export interface GitHubCommitsData {
  commits: GitHubCommit[];
  error?: string;
}

const GITHUB_USERNAME = 'aleromano92';
const GITHUB_TOKEN = import.meta.env.PERSONAL_GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN;

async function fetchUserEvents(): Promise<any[]> {
  const url = `https://api.github.com/users/${GITHUB_USERNAME}/events/public`;
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
    console.error('Error fetching GitHub events:', error);
    throw error;
  }
}

function extractCommitsFromEvents(events: any[]): GitHubCommit[] {
  const commits: GitHubCommit[] = [];
  
  for (const event of events) {
    if (event.type === 'PushEvent' && event.payload?.commits) {
      for (const commit of event.payload.commits) {
        // Skip merge commits and commits by other authors
        if (!commit.message.startsWith('Merge') && commit.author?.name) {
          commits.push({
            sha: commit.sha.substring(0, 7), // Short SHA
            message: commit.message.split('\n')[0], // First line only
            date: event.created_at,
            url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
            repo: event.repo.name
          });
        }
      }
    }
  }
  
  // Sort by date descending and take first 10
  return commits
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

export async function getGitHubCommitsData(): Promise<GitHubCommitsData> {
  try {
    const events = await fetchUserEvents();
    const commits = extractCommitsFromEvents(events);
    
    return {
      commits
    };
  } catch (error) {
    console.error('Failed to fetch GitHub commits:', error);
    
    return {
      commits: [],
      error: 'Failed to load recent commits'
    };
  }
}