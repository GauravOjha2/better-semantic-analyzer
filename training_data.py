import praw
import pandas as pd

# ========== CONFIGURE REDDIT API ==========
CLIENT_ID = "KF1rkHeFHm9cHhmu9bnEWg"
CLIENT_SECRET = "yjzWM7oA4-F2mdZd0qPHDistbY50ug"
USER_AGENT = "semantic-analyzer by u/gaurav_ojha"

reddit = praw.Reddit(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    user_agent=USER_AGENT
)

# ========== DATA FETCH FUNCTIONS ==========
def fetch_user_comments(username: str, limit: int = 100):
    """Fetch recent comments of a Reddit user."""
    user = reddit.redditor(username)
    comments = []
    for comment in user.comments.new(limit=limit):
        comments.append({
            "text": comment.body,
            "created_utc": comment.created_utc,
            "subreddit": str(comment.subreddit)
        })
    return pd.DataFrame(comments)

def fetch_user_posts(username: str, limit: int = 50):
    """Fetch recent submissions of a Reddit user."""
    user = reddit.redditor(username)
    posts = []
    for submission in user.submissions.new(limit=limit):
        posts.append({
            "text": submission.title + " " + (submission.selftext or ""),
            "created_utc": submission.created_utc,
            "subreddit": str(submission.subreddit)
        })
    return pd.DataFrame(posts)

# ========== MAIN ==========
if __name__ == "__main__":
    user_a = "spez"        # replace with target Reddit username
    user_b = "kn0thing"    # replace with target Reddit username

    # Fetch comments + posts
    df_a_comments = fetch_user_comments(user_a)
    df_a_posts = fetch_user_posts(user_a)
    df_b_comments = fetch_user_comments(user_b)
    df_b_posts = fetch_user_posts(user_b)

    # Combine comments + posts per user
    df_a = pd.concat([df_a_comments, df_a_posts], ignore_index=True)
    df_b = pd.concat([df_b_comments, df_b_posts], ignore_index=True)

    # Save to CSV for inspection (optional)
    df_a.to_csv(f"{user_a}_reddit.csv", index=False)
    df_b.to_csv(f"{user_b}_reddit.csv", index=False)

    print(f"Fetched {len(df_a)} posts/comments for {user_a}")
    print(f"Fetched {len(df_b)} posts/comments for {user_b}")
