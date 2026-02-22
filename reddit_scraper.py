"""
Reddit Scraper for Compatibility Analysis System
Fetches user posts using PRAW (Reddit API) with fallback options.
"""
import praw
from typing import List, Dict, Optional
import time
from datetime import datetime
import pandas as pd
from utils import PipelineLogger


class RedditScraper:
    """Scraper for fetching Reddit user posts."""
    
    def __init__(self, client_id: Optional[str] = None, 
                 client_secret: Optional[str] = None,
                 user_agent: Optional[str] = None):
        """
        Initialize Reddit scraper.
        
        For FREE Reddit API access:
        1. Go to https://www.reddit.com/prefs/apps
        2. Click "create another app"
        3. Choose "script"
        4. Get your client_id and client_secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.user_agent = user_agent or "CompatibilityAnalyzer/1.0"
        self.reddit = None
        
        if client_id and client_secret:
            try:
                self.reddit = praw.Reddit(
                    client_id=client_id,
                    client_secret=client_secret,
                    user_agent=self.user_agent
                )
                PipelineLogger.success("Reddit API initialized")
            except Exception as e:
                PipelineLogger.warning(f"Reddit API init failed: {e}")
                PipelineLogger.info("Will use read-only mode")
    
    def fetch_user_posts(self, username: str, limit: int = 100) -> pd.DataFrame:
        """
        Fetch posts and comments from a Reddit user.
        
        Args:
            username: Reddit username (without u/)
            limit: Maximum number of posts to fetch
        
        Returns:
            DataFrame with columns: text, type, score, created_utc
        """
        PipelineLogger.info(f"Fetching posts from u/{username}...")
        
        if not self.reddit:
            # Check if we have valid credentials
            if not self.client_id or not self.client_secret:
                raise ValueError(
                    "Reddit API credentials required! "
                    "Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to secrets.toml"
                )
            
            # Initialize Reddit instance
            self.reddit = praw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                user_agent=self.user_agent,
                check_for_async=False
            )
        
        posts_data = []
        
        try:
            user = self.reddit.redditor(username)
            
            # Fetch submissions (posts)
            PipelineLogger.info("  Fetching submissions...")
            for submission in user.submissions.new(limit=limit // 2):
                text = f"{submission.title}. {submission.selftext}".strip()
                if text and len(text) > 10:  # Filter very short posts
                    posts_data.append({
                        'text': text,
                        'type': 'submission',
                        'score': submission.score,
                        'created_utc': submission.created_utc,
                        'subreddit': str(submission.subreddit)
                    })
            
            # Fetch comments
            PipelineLogger.info("  Fetching comments...")
            for comment in user.comments.new(limit=limit // 2):
                text = comment.body.strip()
                if text and len(text) > 10:
                    posts_data.append({
                        'text': text,
                        'type': 'comment',
                        'score': comment.score,
                        'created_utc': comment.created_utc,
                        'subreddit': str(comment.subreddit)
                    })
            
            df = pd.DataFrame(posts_data)
            
            if len(df) > 0:
                # Sort by score (most popular first)
                df = df.sort_values('score', ascending=False)
                PipelineLogger.success(f"  Fetched {len(df)} posts from u/{username}")
            else:
                PipelineLogger.warning(f"  No posts found for u/{username}")
            
            return df
        
        except Exception as e:
            PipelineLogger.error(f"Failed to fetch u/{username}: {e}")
            return pd.DataFrame()
    
    def save_user_data(self, username: str, limit: int = 100, 
                       output_file: Optional[str] = None) -> str:
        """
        Fetch and save user data to CSV.
        
        Returns:
            Path to saved CSV file
        """
        df = self.fetch_user_posts(username, limit)
        
        if len(df) == 0:
            raise ValueError(f"No data fetched for u/{username}")
        
        # Generate filename
        if not output_file:
            output_file = f"{username}_reddit.csv"
        
        # Save to CSV
        df.to_csv(output_file, index=False)
        PipelineLogger.success(f"Saved to {output_file}")
        
        return output_file


def quick_fetch_users(user1: str, user2: str, 
                     posts_per_user: int = 100) -> tuple:
    """
    Quick function to fetch two users' data.
    
    Returns:
        (csv_path_1, csv_path_2)
    """
    scraper = RedditScraper()
    
    file1 = scraper.save_user_data(user1, posts_per_user)
    time.sleep(2)  # Rate limit courtesy
    file2 = scraper.save_user_data(user2, posts_per_user)
    
    return file1, file2


if __name__ == "__main__":
    # Test scraper
    import sys
    
    if len(sys.argv) > 1:
        username = sys.argv[1]
        scraper = RedditScraper()
        df = scraper.fetch_user_posts(username, limit=50)
        print(f"\nFetched {len(df)} posts from u/{username}")
        print(df.head())
    else:
        print("Usage: python reddit_scraper.py <username>")
