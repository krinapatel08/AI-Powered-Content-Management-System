# 🚀 AI-Powered Content Management System

A lightweight, full-stack CMS built with **React** (frontend) and **Django REST Framework** (backend), enhanced with **AI-powered content generation** using **Gemini (LLM)**. This project serves as a perfect starter for building AI-driven writing tools and intelligent content platforms.

---

## ✨ Features

-   📝 **Content Creation:** Seamless creation and editing of articles via a dedicated React UI.
-   🤖 **AI Content Generation:** Integrated with the Gemini API for intelligent article drafting and enhancement.
-   🏷️ **Smart Tagging:** Automatic suggestions for tags and keywords based on article content.
-   🔗 **Robust API:** A secure and scalable REST API powered by Django and Django REST Framework (DRF).
-   ⚛️ **Modern UI:** A fast, responsive React user interface designed for an optimal writing and previewing experience.
-   🔐 **Security:** Secure server-side handling of the AI API key via environment variables.

---

## 🧰 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (JavaScript) | Component-based UI for writers. |
| **Backend** | Django + DRF (Python) | High-level web framework for the API. |
| **Database** | SQLite | Default simple database for development. |
| **AI Provider** | Gemini API | The core Large Language Model for AI features. |

---

## 🛠️ Setup Instructions

Follow these steps to get the project running locally.

### 1. 🔐 Environment Variables

Create a file named `.env` in the **root (backend)** directory and populate it with your environment variables:

```bash
# .env file content
DJANGO_SECRET_KEY='your-django-secret-key-here'
DEBUG=True
GEMINI_API_KEY='YOUR_GEMINI_API_KEY_HERE'

# Create and activate a Python virtual environment
python -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver

# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm start


