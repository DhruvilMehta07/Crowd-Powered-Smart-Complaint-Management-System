# Crowd-Powered Smart Complaint Management System

**Subject:** IT314 – Software Engineering  
**Instructor:** Prof. Saurabh Tiwari 
**Mentor:** Hetulbhai  

**Team Members — Group 6**  

| Name                          | Student ID   |
|-------------------------------|--------------|
| Mehta Dhruvil Vimalkumar (Leader) | 202301061    |
| Jainil Shailesh Jagtap        | 202301032    |
| Shamit Gandhi                 | 202301041    |
| Bhatt Parth Bhaskarbhai       | 202301022    |
| Om Kantilal Santoki           | 202301019    |
| Neev Vegada                   | 202301031    |
| Tirth Koradiya                | 202301018    |
| Karan Makasana                | 202301053    |
| Rasha Parmar                  | 202301012    |
| Samarth Agarwal               | 202301040    |

## Overview
The Crowd-Powered Smart Complaint Management System modernizes civic issue reporting by enabling quick submissions, AI-powered analysis, and transparent tracking. Citizens submit complaints with an image and description, and the system intelligently processes them to improve prioritization and routing.

## What the Project Does
When a user submits a complaint:  
- GenAI (LangChain + Groq LLM)  
  - Performs severity analysis for all complaint types  
  - Estimates the expected time required for resolution  
  - Provides a “Suggest Department” feature when the user requests it  
- Computer Vision (YOLOv8)  
  - Used only for road-related complaints  
  - Helps enhance severity analysis by identifying road damage patterns  

Citizens can also track complaint status in real time and support local issues through upvotes.

## Problem → Solution Summary
- Slow, outdated reporting → Simple and fast complaint submission  
- No urgency prioritization → AI-driven severity analysis & ETA  
- Users unsure where to report → On-demand department suggestion  
- Lack of transparency → Live complaint tracking  

## Tech Stack
### Backend
- Django
- PostgreSQL  
- Redis  

### AI
- YOLOv8 (Ultralytics) — Computer vision for road complaints severity analysis  
- LangChain — GenAI orchestration  
- Groq LLM (Groq API) — inference for severity, ETA, and suggest-department  

### Frontend
- React.js  
- Tailwind CSS  


## Run Locally
Replace `<your-...>` placeholders with your actual values.

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Crowd-Powered-Smart-Complaint-Management-System.git
cd Crowd-Powered-Smart-Complaint-Management-System
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Install requirements
pip install -r backend/requirements.txt

# Create .env file in backend/ with the following content (example)
SECRET_KEY=<your-secret-key>
DATABASE_URL=postgres://<dbuser>:<dbpass>@localhost:5432/<dbname>
REDIS_URL=redis://localhost:6379
YOLO_MODEL_PATH=../models/yolov8n.pt
GROQ_API_KEY=<your-groq-api-key>
ALLOWED_HOSTS=localhost,127.0.0.1

cd backend
python manage.py migrate

# (Optional) Create superuser
python manage.py createsuperuser

# Run the server
python manage.py runserver
```
### Backend Runs at
http://localhost:7000/

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env.local (if required) and add:
VITE_API_URL=http://localhost:7000/api

# Run dev server
npm run dev
```

