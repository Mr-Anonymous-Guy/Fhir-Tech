# NAMASTE-SYNC - Healthcare Terminology Mapping System

A complete healthcare data management system for FHIR terminology mapping with MongoDB integration.

---

## 🚀 Quick Start Guide (For Beginners)

This guide will help you set up and run the project from scratch, even if you have no prior knowledge.

### Prerequisites

Before starting, you need to install these tools on your computer:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Choose the "LTS" (Long Term Support) version
   - Install with default settings
   - Verify installation: Open PowerShell/Command Prompt and type:
     ```bash
     node --version
     ```
     You should see something like `v18.x.x` or higher

2. **npm** (comes with Node.js)
   - Verify installation:
     ```bash
     npm --version
     ```
     You should see a version number like `9.x.x` or higher

3. **Git** (to clone the repository)
   - Download from: https://git-scm.com/
   - Install with default settings

---

## 📥 Step 1: Clone the Repository

Open PowerShell or Command Prompt and run:

```bash
git clone <repository-url>
cd namaste-sync-33051
```

Replace `<repository-url>` with the actual URL of this repository.

---

## 📦 Step 2: Install Dependencies

### Install Root Project Dependencies

```bash
npm install
```

This will download all required packages for the frontend. It may take a few minutes.

### Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

This installs all packages needed for the backend server.

---

## ▶️ Step 3: Run the Application

Now you're ready to start the application!

```bash
npm run dev:full
```

This single command will:
- ✅ Start the backend server on port 3001
- ✅ Start the frontend on port 8080
- ✅ Automatically download and configure MongoDB (first time only, ~500MB)
- ✅ Create local data folders for storage

**First-time setup**: The first time you run this, it will download MongoDB binaries (~500MB). This only happens once and may take 5-10 minutes depending on your internet speed.

---

## 🌐 Step 4: Access the Application

Once you see these messages:
```
✅ Local MongoDB instance started successfully
✅ Connected to MongoDB: namaste-sync
🚀 NAMASTE-SYNC Backend Server running on port 3001
VITE ready in XXX ms
➜  Local:   http://localhost:8080/
```

Open your web browser and go to:

**http://localhost:8080/**

You should see the NAMASTE-SYNC homepage!

---

## 🛑 Step 5: Stopping the Application

To stop the application:

1. Go to the terminal/PowerShell window where it's running
2. Press `Ctrl + C`
3. Press `Y` if asked to terminate

---

## 📁 Project Structure

After running the application, you'll see these folders:

```
namaste-sync-33051/
├── backend/              # Backend server code
├── src/                  # Frontend React code
├── mongodb-data/         # MongoDB database files (auto-created)
├── local-data/           # Backup storage (auto-created)
├── node_modules/         # Installed packages (auto-created)
└── package.json          # Project configuration
```

**Note**: `mongodb-data/` and `local-data/` folders are created automatically when you first run the app.

---

## 🔧 Common Issues & Solutions

### Issue 1: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Then restart the application
npm run dev:full
```

### Issue 2: "concurrently not found"

**Error**: `'concurrently' is not recognized`

**Solution**:
```bash
# Reinstall dependencies
npm install
cd backend
npm install
cd ..

# Then try again
npm run dev:full
```

### Issue 3: MongoDB Download Fails

**Error**: MongoDB download stuck or fails

**Solution**:
```bash
# Delete the mongodb-data folder
# On Windows:
rmdir /s mongodb-data

# On Mac/Linux:
rm -rf mongodb-data

# Then restart
npm run dev:full
```

### Issue 4: Application Doesn't Load

**Solution**:
1. Make sure both backend and frontend are running (check terminal output)
2. Wait a few seconds for MongoDB to start
3. Try refreshing the browser
4. Check if you see any red error messages in the terminal

---

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev:full` | Start both frontend and backend together |
| `npm run dev` | Start only frontend |
| `npm run backend:dev` | Start only backend |
| `npm run build` | Build for production |
| `npm install` | Install/update dependencies |

---

## 🎯 What This Application Does

NAMASTE-SYNC is a healthcare terminology mapping system that:
- Maps medical terms between different coding systems
- Supports FHIR R4 standards
- Provides user authentication and authorization
- Stores data locally using MongoDB
- Offers a modern web interface for healthcare professionals

---

## 💡 Features

- ✅ **No MongoDB Installation Required** - Automatically downloads and configures MongoDB
- ✅ **Local Data Storage** - All data stored on your computer
- ✅ **User Authentication** - Secure login and signup
- ✅ **Modern UI** - Built with React and Tailwind CSS
- ✅ **Real-time Updates** - Changes reflect immediately
- ✅ **Offline Capable** - Works without internet (after initial setup)

---

## 🔐 First-Time User Setup

1. **Start the application** using `npm run dev:full`
2. **Open your browser** to http://localhost:8080/
3. **Click "Sign Up"** to create your first account
4. **Fill in the form**:
   - Full Name: Your name
   - Email: Your email address
   - Password: At least 6 characters
   - Confirm Password: Same as password
   - Check "I agree to terms"
5. **Click "Sign Up"** - You'll be logged in automatically!

---

## 📚 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB (auto-managed)
- **Authentication**: JWT tokens, bcrypt
- **UI Components**: shadcn/ui, Radix UI

---

## 🆘 Getting Help

If you encounter any issues:

1. Check the "Common Issues" section above
2. Make sure all prerequisites are installed correctly
3. Try deleting `node_modules` and reinstalling:
   ```bash
   rmdir /s node_modules
   npm install
   ```
4. Check the terminal for error messages
5. Contact the development team with error details

---

## 📄 Additional Documentation

For more advanced topics, see:
- `DEPLOY.md` - Production deployment guide
- `DOCKER_DEPLOYMENT.md` - Docker setup instructions
- `START_DEVELOPMENT.md` - Development guidelines

---

## 🎉 You're All Set!

Congratulations! You now have NAMASTE-SYNC running on your computer. Explore the application and enjoy!

For questions or feedback, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**License**: ISC