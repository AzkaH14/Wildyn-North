🦌 Wildlife Sighting and Reporting System

A Final Year Project (FYP) designed to enable individuals and communities to report and track wildlife sightings. The system supports wildlife monitoring and conservation efforts by allowing users to submit sightings, upload images, and view other reported sightings in an organized platform.

📌 Features

🌿 User Roles

Community Users – submit and view collective wildlife reports

Individual Users – create personal accounts and report sightings independently

📍 Wildlife Sighting Reports

Record species details: common name, scientific name, family, description, habitat, location, and date/time

Upload images as evidence

Reports are categorized as verified or unverified

🌐 Interactive UI

Clean, user-friendly login/signup and dashboard interfaces

Easy navigation for browsing reports and submitting sightings

Responsive design for different screen sizes

🧠 Data Management

Reports stored in MongoDB

Backend APIs handle CRUD operations for reports and user data

🔒 Authentication & Security

Secure login and registration with JWT authentication

Password reset functionality via email verification

📊 Analytics Ready

All reports stored systematically for future analysis and wildlife monitoring insights

🛠️ Tech Stack
Component	Technology Used
Frontend	React Native (Expo)
Backend	Node.js / Express.js
Database	MongoDB
Authentication	JWT, NodeMailer
Version Control	Git & GitHub
📁 Folder Structure
Wildyn-North/
├── backend/
│   ├── controllers/       # API logic for users, reports
│   ├── models/            # Mongoose schemas for MongoDB
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, error handling, validation
│   ├── utils/             # Helper functions (email, logging)
│   ├── .env               # Environment variables
│   ├── server.js          # Entry point for backend
│   └── package.json
├── frontend/
│   ├── assets/            # Images, icons, logos
│   ├── components/        # Reusable UI components
│   ├── screens/           # React Native screens
│   ├── navigation/        # React Navigation setup
│   ├── App.js             # Main app file
│   └── package.json
├── README.md
└── .gitignore

📲 Getting Started
1️⃣ Clone the Repository
git clone https://github.com/AzkaH14/Wildyn-North.git
cd Wildyn-North

2️⃣ Install Dependencies
Backend
cd backend
npm install

Frontend
cd ../frontend
npm install

3️⃣ Configure Environment Variables

Create a .env file in the backend/ folder:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
PORT=5000

4️⃣ Run the Application
Backend
cd backend
npm start

Frontend
cd frontend
npm start

🔗 API Endpoints (Backend)
Endpoint	Method	Description
/api/users/register	POST	Register a new user
/api/users/login	POST	Login user and return JWT token
/api/users/forgot-password	POST	Send password reset email
/api/users/reset-password	POST	Reset password using token
/api/reports	GET	Get all wildlife reports
/api/reports	POST	Submit a new wildlife report
/api/reports/:id	PUT	Update a report status (verify)
/api/reports/:id	DELETE	Delete a wildlife report
📸 Screenshots / Demo

(Add actual screenshots or GIFs of the app here for login, dashboard, report submission, and viewing reports)

Login / Signup Screen

Dashboard / Report List

Submit Wildlife Report Form

Report Detail View

👥 Project Team Members
Name	ID
Azka Humayon	47631
Aleeha Akhlaq	46174
Rida Fatima	48403
⚡ Challenges Faced

MongoDB Setup Delay – Configuration issues slowed progress on database-related tasks

Git Merge Conflicts – Some files lost; resolved via restoring previous commits and branch management

Email Authentication – “Forgot Password” emails failed initially due to SMTP issues

API Integration Errors – Frontend-backend mismatches resolved with coordinated debugging

Deployment Delays – Environment differences between team members caused minor integration issues

📄 License

This project is for academic purposes only. Please contact the team for commercial or external use.

📝 Future Improvements

Add push notifications for new verified wildlife reports

Integrate map-based report visualization

Implement AI-assisted species recognition from uploaded images

Add analytics dashboards for wildlife monitoring
