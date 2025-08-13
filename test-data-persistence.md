# Testing Data Persistence Features

## Overview
This guide helps you test that user data is properly stored and retrieved across sessions.

## Prerequisites
1. Backend server running on port 5000
2. Database initialized with `node server/init-database.js`
3. Frontend application running
4. At least one user account created

## Test Scenarios

### 1. Basic Data Storage Test

**Steps:**
1. Log in with your account
2. Start an interview on any topic
3. Complete the interview with some answers
4. Check that results appear in your profile
5. Log out and log back in
6. Verify that your interview history is still there

**Expected Result:** Interview data should persist across login sessions.

### 2. Multiple User Isolation Test

**Steps:**
1. Create two different user accounts
2. Log in with User A and complete an interview
3. Log out and log in with User B
4. Complete an interview with User B
5. Log out and log back in with User A
6. Verify User A only sees their own data

**Expected Result:** Each user should only see their own interview history.

### 3. Analytics Dashboard Test

**Steps:**
1. Complete multiple interviews on different topics
2. Go to your profile page
3. Check the analytics dashboard shows:
   - Total attempts count
   - Average score
   - Best score
   - Topics attempted count
4. Verify the performance chart shows recent attempts
5. Check topic-wise performance breakdown

**Expected Result:** All analytics should reflect your actual interview data.

### 4. Data Export Test

**Steps:**
1. Complete several interviews
2. Go to profile page
3. Click "Export CSV" button
4. Download and open the CSV file
5. Verify it contains all your interview data

**Expected Result:** CSV should contain all interview attempts with scores, dates, and topics.

## Database Verification

### Check Database Directly

```bash
# Connect to SQLite database
sqlite3 server/interview_assistant.db

# View users table
SELECT * FROM users;

# View interview attempts for a specific user
SELECT * FROM interview_attempts WHERE user_id = 1;

# Check analytics data
SELECT 
  COUNT(*) as total_attempts,
  AVG(score) as average_score,
  MAX(score) as best_score
FROM interview_attempts 
WHERE user_id = 1;
```

### Expected Database State

After completing interviews, you should see:
- **users table**: Contains user accounts
- **interview_attempts table**: Contains interview results with user_id foreign key
- **questions table**: Contains question bank
- **question_usage table**: Tracks which questions users have seen

## Troubleshooting

### Common Issues

1. **Data not saving**: Check server logs for database errors
2. **Analytics not updating**: Refresh profile page after completing interviews
3. **User isolation not working**: Verify JWT tokens are being sent with requests
4. **Database connection errors**: Ensure SQLite database file exists and is writable

### Debug Steps

1. Check browser console for API errors
2. Verify server is running on correct port
3. Check database file permissions
4. Verify JWT token in localStorage
5. Check network tab for failed API calls

## Performance Metrics

### Expected Response Times

- **Profile load**: < 2 seconds
- **Analytics calculation**: < 1 second
- **Interview save**: < 500ms
- **Data export**: < 3 seconds

### Data Volume

- **Small dataset**: < 100 attempts - should load instantly
- **Medium dataset**: 100-1000 attempts - should load in < 2 seconds
- **Large dataset**: > 1000 attempts - should load in < 5 seconds

## Security Verification

### Test Cases

1. **Unauthorized access**: Try to access profile without logging in
2. **Cross-user data access**: Try to access another user's data
3. **Token tampering**: Modify JWT token in localStorage
4. **SQL injection**: Try malicious input in search fields

### Expected Results

- All unauthorized requests should return 401/403 errors
- Users should only see their own data
- Invalid tokens should be rejected
- Input should be properly sanitized

## Success Criteria

✅ **Data Persistence**: Interview results saved and retrieved correctly
✅ **User Isolation**: Each user sees only their own data
✅ **Analytics Accuracy**: Dashboard shows correct statistics
✅ **Cross-Session**: Data available after logout/login
✅ **Performance**: Fast loading and responsive interface
✅ **Security**: Proper authentication and authorization
✅ **Export**: CSV download contains all user data
