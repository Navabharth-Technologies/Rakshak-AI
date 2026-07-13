# Rakshak AI 🛡️

Rakshak AI is an advanced law enforcement and crime analysis application designed to assist in case management, report generation, and data-driven policing. It integrates AI-driven capabilities like OCR (Optical Character Recognition) for evidence extraction, speech recognition, and interactive maps for spatial crime analysis. The platform leverages **Zoho Catalyst** for its robust serverless backend and **React** for a highly interactive and responsive user interface.

## 🌐 Live Application
Access the deployed application here: **[Insert Your Deployed URL Here - e.g., https://rakshak-ai-12345.zapps.io]**

*(Note: If the application requires a login, you can provide test credentials here, e.g., Username: admin@police.gov | Password: admin123)*

---

## 🚀 Features

- **Advanced Case & Alert Management**: Streamlined tracking of ongoing cases, alerts, and FIR reports.
- **AI-Powered OCR**: Automatically extract text from CCTV logs, WhatsApp chats, and physical evidence documents using Tesseract.js.
- **Speech Recognition**: Voice-to-text integration for quick reporting and note-taking.
- **Interactive Crime Mapping**: Geospatial analysis of crime hotspots and case locations using React Leaflet.
- **Data Visualization**: Real-time charts and metrics powered by Recharts to analyze daily crime reports.
- **Secure Authentication**: Role-based access control and user management.
- **Serverless Backend**: Powered by Zoho Catalyst Functions and QuickML integrations.

## 💻 Tech Stack

**Frontend:**
- React 18 (with Vite)
- TypeScript
- Tailwind CSS & Framer Motion (Styling & Animations)
- Zustand (State Management)
- Recharts (Data Visualization)
- React Leaflet (Maps)
- Tesseract.js (OCR)
- React Speech Recognition

**Backend:**
- Zoho Catalyst Serverless Functions (`rakshak_function`, `daily_crime_report`, `case_event_handler`)
- Zoho Catalyst Datastore & ZCQL
- Zoho QuickML

---

## 📁 Project Structure

```text
Rakshak-AI/
├── react-vite/               # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page layouts (Reports, Alerts, Admin, etc.)
│   │   ├── store/            # Zustand state management
│   │   └── ...
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
├── functions/                # Zoho Catalyst Serverless Functions
│   ├── rakshak_function/     # Main API function
│   ├── daily_crime_report/   # Scheduled CRON function
│   └── case_event_handler/   # Event-driven function
├── circuits/                 # Catalyst circuits for workflow orchestration
├── catalyst.json             # Zoho Catalyst configuration file
└── README.md                 # Project documentation
```

---

## 🛠️ Local Development Setup

To run this project on your local machine, follow these steps:

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Git**
- **Zoho Catalyst CLI** (Install globally via `npm install -g zcatalyst-cli`)
- A Zoho Catalyst account.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Rakshak-AI.git
cd Rakshak-AI
```

### 2. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd react-vite
npm install
```

### 3. Backend (Catalyst) Setup
Log into your Zoho Catalyst account from the CLI:
```bash
catalyst login
```
Initialize the Catalyst project in the root folder to link it to your remote workspace:
```bash
cd ..
catalyst init
```
Install dependencies for the backend functions:
```bash
cd functions/rakshak_function
npm install
cd ../daily_crime_report
npm install
cd ../case_event_handler
npm install
cd ../..
```

---

## ▶️ Running the Application Locally

You will need two terminal windows to run both the frontend and the backend emulator simultaneously.

### 1. Start the Catalyst Backend Emulator
Open a terminal in the root of the project (`Rakshak-AI` directory) and run:
```bash
catalyst serve
```
This emulates the Zoho Catalyst environment locally for your APIs and functions.

### 2. Start the Frontend Development Server
Open a second terminal window, navigate to the frontend directory, and start the Vite server:
```bash
cd react-vite
npm run dev
```
The frontend will now be accessible in your browser at `http://localhost:5173`.

---

## 🚀 Deployment Instructions

To deploy the application to Zoho Catalyst production:

1. **Build the React application:**
   ```bash
   cd react-vite
   npm run build
   cd ..
   ```
2. **Deploy using Catalyst CLI:**
   From the root folder, run:
   ```bash
   catalyst deploy
   ```
3. Once deployed, the CLI will output the live Web App URL. You can use that URL to access the production version of Rakshak AI.