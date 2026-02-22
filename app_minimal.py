"""
🎯 MINIMAL Reddit Compatibility Analyzer
Clean, fast, no BS - just LLM analysis with great UI
"""
import streamlit as st
import pandas as pd
from typing import Optional
import random

try:
    from reddit_scraper import RedditScraper
    from llm_providers import LLMProvider, PROVIDER_INFO
except ImportError as e:
    st.error(f"Missing dependencies: {e}")
    st.stop()


# ============================================
# PAGE CONFIGURATION
# ============================================
st.set_page_config(
    page_title="Reddit Compatibility Analyzer",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ============================================
# CUSTOM CSS FOR BETTER UI
# ============================================
st.markdown("""
<style>
    /* Main app styling */
    .main {
        padding-top: 2rem;
    }
    
    /* Card-like containers */
    .stTextInput > div > div > input {
        border-radius: 10px;
        border: 2px solid #e0e0e0;
        padding: 12px;
        font-size: 16px;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #4CAF50;
        box-shadow: 0 0 0 0.2rem rgba(76, 175, 80, 0.25);
    }
    
    /* Buttons */
    .stButton > button {
        width: 100%;
        border-radius: 10px;
        height: 50px;
        font-size: 18px;
        font-weight: bold;
        background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
        border: none;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    /* Metrics */
    [data-testid="stMetricValue"] {
        font-size: 28px;
        font-weight: bold;
    }
    
    /* Expander */
    .streamlit-expanderHeader {
        background-color: #f5f5f5;
        border-radius: 10px;
        font-weight: bold;
    }
    
    /* Success/Error messages */
    .stSuccess, .stError, .stWarning, .stInfo {
        border-radius: 10px;
        padding: 1rem;
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    /* Headers */
    h1 {
        color: #2c3e50;
        font-weight: 800;
    }
    
    h2, h3 {
        color: #34495e;
    }
    
    /* Divider */
    hr {
        margin: 2rem 0;
        border: none;
        border-top: 2px solid #e0e0e0;
    }
</style>
""", unsafe_allow_html=True)


# ============================================
# CORE FUNCTIONS - NO CROSS-ENCODER BS!
# ============================================

@st.cache_data(ttl=3600, show_spinner=False)
def fetch_reddit_posts(username: str, limit: int = 100) -> pd.DataFrame:
    """Fetch Reddit posts with caching."""
    reddit_id = st.secrets.get("REDDIT_CLIENT_ID", None)
    reddit_secret = st.secrets.get("REDDIT_CLIENT_SECRET", None)
    scraper = RedditScraper(client_id=reddit_id, client_secret=reddit_secret)
    return scraper.fetch_user_posts(username, limit)


def generate_analysis(provider_name: str, posts1: list, posts2: list, 
                      user1: str, user2: str, num_samples: int = 15) -> str:
    """
    Generate compatibility analysis using DIRECT LLM analysis.
    No cross-encoder, no BS scoring - just smart sampling + LLM!
    """
    provider = LLMProvider.get_provider(provider_name)
    
    # Smart sampling: mix random + longest posts
    all_pairs = [(p1, p2) for p1 in posts1 for p2 in posts2]
    
    # Get diverse samples (random + longest)
    random_pairs = random.sample(all_pairs, min(num_samples // 2, len(all_pairs)))
    sorted_pairs = sorted(all_pairs, key=lambda x: len(x[0]) + len(x[1]), reverse=True)
    longest_pairs = sorted_pairs[:num_samples // 2]
    
    sample_pairs = random_pairs + longest_pairs
    
    # Build analysis prompt
    pairs_text = ""
    for i, (p1, p2) in enumerate(sample_pairs[:num_samples], 1):
        pairs_text += f"\n**Pair {i}:**\n"
        pairs_text += f"• {user1}: {p1[:300]}{'...' if len(p1) > 300 else ''}\n"
        pairs_text += f"• {user2}: {p2[:300]}{'...' if len(p2) > 300 else ''}\n"
    
    prompt = f"""You are an expert social psychologist analyzing Reddit users for compatibility.

**Users:** u/{user1} and u/{user2}

**Sample Post Comparisons:**
{pairs_text}

**Your Task:**
Create a comprehensive, insightful compatibility report with these sections:

### 🎯 Overall Compatibility Score
Provide a qualitative rating (Excellent/High/Moderate/Low/Minimal) with brief justification.

### 🔗 Shared Interests & Values  
Identify 3-5 key areas where they align. Be specific with examples from their posts.

### ⚖️ Complementary Differences
What differences make them interesting to each other? Not conflicts, but complementary traits.

### 💬 Communication Style Analysis
How do they express themselves? Formal vs casual? Humorous vs serious? Data-driven vs emotional?

### 🌟 Relationship Potential
What kind of connection would work best? (Friendship, mentorship, collaboration, romantic, etc.)

### 💡 5 Conversation Starters
Specific, engaging questions that would spark great discussions between them.

**Tone:** Insightful, warm, honest. Focus on genuine compatibility, not forced connections.
"""
    
    return provider.generate(prompt, max_tokens=2500, temperature=0.7)


# ============================================
# MAIN APP UI
# ============================================

def main():
    # Header with gradient effect
    st.markdown("""
    <div style='text-align: center; padding: 2rem 0;'>
        <h1 style='font-size: 3.5rem; margin-bottom: 0.5rem;'>
            🎯 Reddit Compatibility Analyzer
        </h1>
        <p style='font-size: 1.3rem; color: #7f8c8d; margin-top: 0;'>
            Discover connection potential between <strong>ANY</strong> two Reddit users
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # ============================================
    # SIDEBAR - SETTINGS (No provider selection shown)
    # ============================================
    provider = 'groq'  # Use Groq by default (unlimited free)
    
    with st.sidebar:
        st.header("⚙️ Settings")
        
        # Advanced settings
        st.subheader("🎛️ Analysis Depth")
        posts_limit = st.slider(
            "Posts per user",
            min_value=20,
            max_value=200,
            value=50,
            step=10,
            help="More posts = more data, but slower"
        )
        
        sample_pairs = st.slider(
            "Post pairs to analyze",
            min_value=10,
            max_value=30,
            value=15,
            step=5,
            help="Number of post comparisons sent to AI"
        )
        
        st.markdown("---")
        
        # Example usernames
        st.subheader("💡 Example Users")
        st.markdown("""
        Try these active Reddit users:
        - **mistersavage** (Adam Savage)
        - **J_Kenji_Lopez-Alt** (Chef)
        - **GovSchwarzenegger** (Arnold)
        - **thisisbillgates** (Bill Gates)
        - **ReallyRickAstley** (Rick Astley)
        """)
    
    # ============================================
    # MAIN CONTENT - USER INPUT
    # ============================================
    
    col1, col2 = st.columns(2, gap="large")
    
    with col1:
        st.markdown("### 👤 Reddit User 1")
        user1 = st.text_input(
            "Username (without u/)",
            placeholder="mistersavage",
            key="user1",
            label_visibility="collapsed"
        )
    
    with col2:
        st.markdown("### 👤 Reddit User 2")
        user2 = st.text_input(
            "Username (without u/)",
            placeholder="J_Kenji_Lopez-Alt",
            key="user2",
            label_visibility="collapsed"
        )
    
    # Big analyze button
    st.markdown("<br>", unsafe_allow_html=True)
    analyze_clicked = st.button("🔍 Analyze Compatibility", use_container_width=True)
    
    # ============================================
    # ANALYSIS EXECUTION
    # ============================================
    
    if analyze_clicked:
        if not user1 or not user2:
            st.error("⚠️ Please enter both usernames!")
            return
        
        if user1 == user2:
            st.warning("🤔 That's the same person! Enter two different usernames.")
            return
        
        # Progress container
        progress_container = st.container()
        
        with progress_container:
            # Step 1: Fetch user 1
            with st.spinner(f"📡 Fetching posts from u/{user1}..."):
                try:
                    df1 = fetch_reddit_posts(user1, posts_limit)
                    posts1 = df1['text'].tolist()
                    st.success(f"✅ Fetched {len(posts1)} posts from u/{user1}")
                except Exception as e:
                    st.error(f"❌ Failed to fetch u/{user1}: {str(e)}")
                    return
            
            # Step 2: Fetch user 2
            with st.spinner(f"📡 Fetching posts from u/{user2}..."):
                try:
                    df2 = fetch_reddit_posts(user2, posts_limit)
                    posts2 = df2['text'].tolist()
                    st.success(f"✅ Fetched {len(posts2)} posts from u/{user2}")
                except Exception as e:
                    st.error(f"❌ Failed to fetch u/{user2}: {str(e)}")
                    return
            
            # Step 3: Generate analysis
            with st.spinner(f"� Analyzing compatibility patterns..."):
                try:
                    report = generate_analysis(
                        provider, posts1, posts2, user1, user2, sample_pairs
                    )
                except Exception as e:
                    st.error(f"❌ Analysis failed. Please try again.")
                    return
        
        # ============================================
        # RESULTS DISPLAY
        # ============================================
        
        st.markdown("---")
        st.markdown(f"## 📋 Compatibility Report: u/{user1} ↔️ u/{user2}")
        
        # Metrics row
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("User 1 Posts", len(posts1))
        with col2:
            st.metric("User 2 Posts", len(posts2))
        with col3:
            st.metric("Pairs Analyzed", sample_pairs)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Display report in nice container
        st.markdown(report)
        
        # ============================================
        # ADDITIONAL FEATURES
        # ============================================
        
        st.markdown("---")
        
        # Sample posts viewer
        with st.expander("📝 View Sample Posts", expanded=False):
            tab1, tab2 = st.tabs([f"u/{user1}", f"u/{user2}"])
            
            with tab1:
                st.dataframe(
                    df1[['text', 'type', 'score', 'subreddit']].head(10),
                    use_container_width=True,
                    hide_index=True
                )
            
            with tab2:
                st.dataframe(
                    df2[['text', 'type', 'score', 'subreddit']].head(10),
                    use_container_width=True,
                    hide_index=True
                )
        
        # Download report
        st.download_button(
            label="📥 Download Report",
            data=report,
            file_name=f"compatibility_{user1}_{user2}.md",
            mime="text/markdown",
            use_container_width=True
        )


if __name__ == "__main__":
    main()
