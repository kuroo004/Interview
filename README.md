# AI Interview Assistant - Enhanced Edition

A comprehensive interview preparation system with user authentication, performance analytics, and AI-powered feedback. Built with React, Node.js, and SQLite.

## 🚀 Features

### 🔐 User Authentication & Management
- **Secure User Registration & Login**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Complete user information management
- **Session Management**: Persistent login sessions with secure token storage

### 📊 Advanced Performance Analytics
- **Comprehensive Dashboard**: Real-time performance metrics and trends
- **Multiple Chart Types**: 
  - Line charts for score progression
  - Bar charts for topic performance
  - Radar charts for skill assessment
  - Doughnut charts for attempt distribution
  - Polar area charts for topic analysis
- **Performance Indicators**: Score trends, improvement tracking, and personalized insights

### 🎯 Question Management System
- **50+ Questions per Topic**: Comprehensive question database across multiple domains
- **Smart Question Shuffling**: Server-side randomization ensuring no repeats until pool exhaustion
- **Topic Coverage**: JavaScript, React, Node.js, Data Structures, System Design, Machine Learning

### 📈 Detailed Performance Reports
- **Individual Attempt Analysis**: Comprehensive breakdown of each interview attempt
- **Skill Assessment**: Multi-dimensional performance evaluation
- **Personalized Recommendations**: AI-generated improvement suggestions
- **Export & Print**: Save reports as CSV or print for offline review

### 🎨 Modern UI/UX
- **Futuristic Design**: Gradient backgrounds, glassmorphism effects, and smooth animations
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Interactive Elements**: Hover effects, transitions, and dynamic content loading

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Chart.js** with React wrappers for data visualization
- **Lucide React** for modern icons

### Backend
- **Node.js** with Express.js
- **SQLite3** for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn package manager
- Modern web browser with ES6+ support

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the `server` directory:
```bash
cd server
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 5. Initialize Database
```bash
cd server
npm run init-db
```

This will create the SQLite database with:
- Users table for authentication
- Questions table with 50+ questions per topic
- Interview attempts table for performance tracking
- Question usage tracking for smart shuffling

### 6. Start the Backend Server
```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`

### 7. Start the Frontend Development Server
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## 🎯 Usage Guide

### User Registration & Login
1. **Register**: Create a new account with username, password, and optional email
2. **Login**: Access your account with secure authentication
3. **Profile Management**: View and manage your account information

### Taking Interviews
1. **Topic Selection**: Choose from available topics (JavaScript, React, Node.js, etc.)
2. **Interview Mode**: Select between normal and proctored modes
3. **Question Flow**: Answer randomized questions with AI-powered analysis
4. **Results**: Get immediate feedback and performance scores

### Performance Analysis
1. **Dashboard**: View overall performance metrics and trends
2. **Detailed Reports**: Generate comprehensive performance reports for each attempt
3. **Export Data**: Download CSV files or print reports for offline review
4. **Progress Tracking**: Monitor improvement over time

### Profile & History
1. **Interview History**: View all past attempts with filtering and sorting
2. **Performance Metrics**: Track scores, accuracy, and time management
3. **Topic Analysis**: Identify strengths and areas for improvement
4. **Data Export**: Download your complete interview history

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Questions Table
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Interview Attempts Table
```sql
CREATE TABLE interview_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  score REAL NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  duration_minutes INTEGER,
  confidence_score REAL,
  facial_expression_score REAL,
  attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Question Usage Tracking
```sql
CREATE TABLE question_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/profile` - Get user profile
- `GET /api/attempts` - Get user's interview attempts
- `POST /api/attempts` - Submit interview attempt

### Questions & Topics
- `GET /api/topics` - Get available topics
- `GET /api/questions/:topic` - Get randomized questions for a topic

### Analytics
- `GET /api/analytics` - Get comprehensive performance analytics

## 🎨 Customization

### Adding New Topics
1. Add questions to the `questionsData` object in `server/init-database.js`
2. Run `npm run init-db` to update the database
3. The new topic will automatically appear in the frontend

### Modifying Question Pool
1. Edit the questions array in `server/init-database.js`
2. Ensure each topic has at least 50 questions
3. Reinitialize the database

### Styling Customization
- Modify `tailwind.config.js` for theme changes
- Update component styles in the `src/components` directory
- Customize chart colors and themes in chart components

## 🚀 Deployment

### Frontend Build
```bash
npm run build
```
The built files will be in the `dist` directory.

### Backend Production
```bash
cd server
npm start
```

### Environment Variables for Production
```env
PORT=5000
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based sessions
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin access

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

## 🔮 Future Enhancements

- **Real-time Collaboration**: Multi-user interview sessions
- **Advanced AI Analysis**: Enhanced performance insights
- **Mobile App**: Native mobile applications
- **Video Recording**: Interview session recording and playback
- **Integration APIs**: Connect with external learning platforms

---

**Built with ❤️ using modern web technologies** 