# 🎯 Reddit Compatibility Analyzer

A minimal, fast web app that analyzes compatibility between any two Reddit users using AI.

## 🚀 Live Demo
[Add your Streamlit deployment URL here]

## ✨ Features
- Analyze **any** Reddit users
- Clean, modern UI
- Fast AI-powered insights
- No complex ML models needed
- Free API (Groq)

## 🛠️ Setup

### 1. Install Dependencies
```bash
pip install -r requirements_minimal.txt
```

### 2. Get API Keys

**Reddit API** (Free):
1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app" → choose "script"
3. Copy `client_id` and `client_secret`

**Groq API** (Free, Unlimited):
1. Go to https://console.groq.com
2. Sign up and get your API key

### 3. Configure Secrets

Create `.streamlit/secrets.toml`:
```toml
GROQ_API_KEY = "your_groq_key_here"
REDDIT_CLIENT_ID = "your_reddit_id"
REDDIT_CLIENT_SECRET = "your_reddit_secret"
```

### 4. Run Locally
```bash
streamlit run app_minimal.py
```

## 📦 Deploy to Streamlit Cloud

1. Push code to GitHub
2. Go to https://share.streamlit.io
3. Connect your repo
4. Set secrets in Streamlit Cloud dashboard
5. Deploy!

## 🎓 Example Users to Try
- **mistersavage** (Adam Savage)
- **J_Kenji_Lopez-Alt** (Chef Kenji)
- **GovSchwarzenegger** (Arnold Schwarzenegger)
- **thisisbillgates** (Bill Gates)

## 📝 License
MIT
