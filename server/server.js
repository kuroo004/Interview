const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, 'interview_assistant.db');
const db = new sqlite3.Database(dbPath);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, username, email } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username, 
            email: user.email 
          } 
        });
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Get interview questions (with shuffling logic)
app.get('/api/questions/:topic', authenticateToken, (req, res) => {
  const { topic } = req.params;
  const { count = 5 } = req.query;

  // First, check how many questions the user has used for this topic
  db.get(
    `SELECT COUNT(DISTINCT q.id) as used_count 
     FROM questions q 
     JOIN question_usage qu ON q.id = qu.question_id 
     WHERE q.topic = ? AND qu.user_id = ?`,
    [topic, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const usedCount = result.used_count || 0;

      // Get total questions for this topic
      db.get(
        'SELECT COUNT(*) as total FROM questions WHERE topic = ?',
        [topic],
        (err, totalResult) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const totalQuestions = totalResult.total;

          // If all questions have been used, reset usage for this user and topic
          if (usedCount >= totalQuestions) {
            db.run(
              `DELETE FROM question_usage 
               WHERE user_id = ? AND question_id IN (
                 SELECT id FROM questions WHERE topic = ?
               )`,
              [req.user.id, topic],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }
                // Continue to get questions (now all questions are available again)
                getRandomQuestions();
              }
            );
          } else {
            getRandomQuestions();
          }

          function getRandomQuestions() {
            // Get questions that haven't been used by this user for this topic
            db.all(
              `SELECT q.* FROM questions q 
               WHERE q.topic = ? 
               AND q.id NOT IN (
                 SELECT qu.question_id 
                 FROM question_usage qu 
                 WHERE qu.user_id = ?
               )
               ORDER BY RANDOM() 
               LIMIT ?`,
              [topic, req.user.id, parseInt(count)],
              (err, questions) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                // Mark these questions as used
                const insertUsage = db.prepare(
                  'INSERT INTO question_usage (user_id, question_id) VALUES (?, ?)'
                );

                questions.forEach(question => {
                  insertUsage.run([req.user.id, question.id]);
                });

                insertUsage.finalize();

                res.json(questions);
              }
            );
          }
        }
      );
    }
  );
});

// Submit interview attempt
app.post('/api/attempts', authenticateToken, (req, res) => {
  const { 
    topic, 
    score, 
    totalQuestions, 
    correctAnswers, 
    durationMinutes,
    confidenceScore,
    facialExpressionScore 
  } = req.body;

  if (!topic || score === undefined || !totalQuestions || correctAnswers === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO interview_attempts 
     (user_id, topic, score, total_questions, correct_answers, duration_minutes, confidence_score, facial_expression_score) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, topic, score, totalQuestions, correctAnswers, durationMinutes, confidenceScore, facialExpressionScore],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ 
        id: this.lastID,
        message: 'Attempt saved successfully' 
      });
    }
  );
});

// Get user's interview attempts
app.get('/api/attempts', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM interview_attempts 
     WHERE user_id = ? 
     ORDER BY attempt_date DESC`,
    [req.user.id],
    (err, attempts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(attempts);
    }
  );
});

// Get performance analytics
app.get('/api/analytics', authenticateToken, (req, res) => {
  // Get overall statistics
  db.get(
    `SELECT 
       COUNT(*) as total_attempts,
       AVG(score) as average_score,
       MAX(score) as best_score,
       MIN(score) as worst_score,
       AVG(duration_minutes) as avg_duration
     FROM interview_attempts 
     WHERE user_id = ?`,
    [req.user.id],
    (err, overall) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get topic-wise statistics
      db.all(
        `SELECT 
           topic,
           COUNT(*) as attempts,
           AVG(score) as avg_score,
           MAX(score) as best_score,
           MIN(score) as worst_score
         FROM interview_attempts 
         WHERE user_id = ? 
         GROUP BY topic`,
        [req.user.id],
        (err, topicStats) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get recent attempts for trend analysis
          db.all(
            `SELECT 
               score,
               attempt_date,
               topic,
               confidence_score,
               facial_expression_score
             FROM interview_attempts 
             WHERE user_id = ? 
             ORDER BY attempt_date DESC 
             LIMIT 20`,
            [req.user.id],
            (err, recentAttempts) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                overall,
                topicStats,
                recentAttempts
              });
            }
          );
        }
      );
    }
  );
});

// Get available topics
app.get('/api/topics', (req, res) => {
  db.all(
    'SELECT DISTINCT topic FROM questions ORDER BY topic',
    (err, topics) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(topics.map(t => t.topic));
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
}); 