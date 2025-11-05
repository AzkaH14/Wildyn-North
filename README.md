🐾 Wildyn North – Wildlife Sighting & Reporting Application

Wildyn North is a real-time wildlife sighting and reporting application designed to connect communities, researchers, and environmental authorities through digital wildlife data.
The system enables users to report wildlife sightings, view interactive maps, and analyze real-time data to help conserve biodiversity and promote environmental awareness.

🌍 Features
🦜 Core Functionalities

Wildlife Report Submission:
Users can submit sightings by providing animal details, images, and location.

Interactive Map:
Displays all reported sightings with real-time updates using Google Maps API.

Real-Time Analytics:
Track reports geographically and statistically to identify wildlife activity trends.

Researcher Verification:
Authorized researchers can verify submitted reports for authenticity.

MongoDB: For storing and managing report and user data.

Push Notifications:
Notify users when sightings occur in nearby areas or when reports are verified.

🧩 Tech Stack

Frontend (Mobile) | React Native (Expo)
Backend	     |      Node.js + Express.js
Database	   |      MongoDB Atlas
Authentication |   	MongoDB
Map & Location Services |	Google Maps SDK for Android

---

🗺️ Key Modules of Wildyn North
1. 👤 User Management & Roles

Secure user registration and login (Community Users & Researchers).

Password recovery via email.

Role-based access control ensuring separate privileges for researchers and community users.

Researcher validation for report authenticity.

2. 🦜 Wildlife Sighting, Reporting & Validation

Submit sightings with species name, health, photo, and auto GPS capture.

Verified reports are highlighted; unverified ones remain pending.

Researchers can approve, reject, or validate sightings.

Community members can comment, pin/unpin, and view verified posts (with profanity filtering).

3. 🤖 Species Identification (AI-Based)

AI species recognition during report submission.

Option to enable or disable AI identification.

System compares uploaded images with dataset and displays confidence scores for species match.

4. 📊 Analytics & Interactive Map

Visualize wildlife sightings on a Google Map with zoom and species details.

Real-time statistics update automatically when new reports are submitted.

Dynamic map markers showing live sightings and report density.

5. 🔔 Notifications System

Researchers receive alerts when new reports are submitted.

Users get notified when researchers upload new survey forms or guides.

6. 📚 Community & Education

Users earn badges and rankings for consistent species reporting.

Researchers can upload species facts, conservation guides, and wildlife education content.

Users can explore the Researcher Library for verified wildlife information.

7. 🌐 Offline Mode

Offline report submission with automatic sync when internet connectivity is restored.

8. 🔍 Search & Filter

Search and filter wildlife reports by species name, date, or location.

9. 🕓 Reporting History

View all past reports with status: Verified / Unverified.

Users can delete, pin, or unpin their own reports for quick access.

10. 🛠️ Admin Panel

Centralized Admin Dashboard for managing users and reports.

Handle spam or inappropriate content by deleting offensive reports/comments.

Moderate community interactions to maintain report authenticity.

---


## 📲 Getting Started

### 1️⃣ Clone the Repository

git clone https://github.com/AzkaH14/Wildyn-North.git
cd Wildyn-North

2. Frontend Setup (React Native + Expo)
Navigate to the app folder:
cd app

Install dependencies:
npm install

Start the Expo development server:
npx expo start


📱 Tip: Scan the QR code with Expo Go (Android/iOS) to run the app on your mobile device.

🖥️ 3. Backend Setup (Node.js + Express + MongoDB)
Navigate to the backend folder:
cd ../backend

Install dependencies:
npm install

🔑 4. Configure Environment Variables

Create a .env file inside the backend directory with the following keys:
ONGODB_URI=mongodb+srv://fyp123_db_user:myNewfyp135@fypcluster.esvbtmd.mongodb.net/wildlife-app?retryWrites=true&w=majority&appName=FYPCluster
PORT=5000

🚀 5. Run the Backend Server
node server.js

or for live reload:

npm run dev

If setup is successful, you should see:
Server running on port 5000
Connected to MongoDB successfully
