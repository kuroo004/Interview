# Configuration Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Gemini AI API Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API Configuration (if using separate backend)
VITE_API_BASE_URL=http://localhost:5000

# Other Configuration
VITE_APP_NAME=Interview Assistant
VITE_APP_VERSION=1.0.0
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key and paste it in your `.env` file

## Recent Improvements

### Error Handling & Retry Logic

The application now includes robust error handling for API failures:

- **Automatic Retries**: Up to 3 retry attempts with exponential backoff
- **Smart Retry Logic**: Only retries on retryable errors (503, 429, network issues)
- **User-Friendly Messages**: Clear error messages explaining what went wrong
- **Fallback Mechanisms**: Graceful degradation when AI services are unavailable

### Balanced Grading System

The interview grading has been redesigned to be encouraging while maintaining realistic standards:

- **Score Inflation**: All scores are automatically boosted by 1 point (reduced from 2)
- **Minimum Score**: The lowest possible score is now 5/10 (instead of 1/10)
- **Balanced AI**: AI analysis focuses on strengths while providing constructive improvement suggestions
- **Realistic Feedback**: Encouraging feedback that motivates improvement without being overly generous
- **Confidence Building**: Questions designed to make users feel capable, not artificially successful

### Data Persistence & User Analytics

**Complete User Data Storage**: All interview attempts are now permanently stored and tied to user accounts:

- **Interview Results**: Scores, answers, analysis, and timing are saved to the database
- **User Progress**: Complete history of all test attempts across sessions
- **Performance Analytics**: Detailed statistics and progress tracking
- **Cross-Session Persistence**: Data remains available after logging out and back in

**What Gets Stored**:
- Interview scores and feedback
- Question responses and AI analysis
- Time taken for each interview
- Test mode (proctored vs normal)
- Date and time of each attempt
- Topic-specific performance data

**User Profile Features**:
- Performance overview dashboard
- Recent performance trends
- Topic-wise analytics
- Progress tracking over time
- Export functionality for data analysis

### Retryable Errors

The system automatically retries on these error types:
- 503 Service Unavailable (model overloaded)
- 429 Too Many Requests
- Network connectivity issues
- Temporary service disruptions

### Non-Retryable Errors

These errors are not retried and show appropriate user messages:
- Invalid API keys
- Malformed requests
- Permanent service issues

## How Data Persistence Works

1. **User Login**: Each user has a unique account with secure authentication
2. **Interview Completion**: When an interview ends, all data is automatically saved to the database
3. **Data Association**: All data is tied to the user's account using JWT tokens
4. **Profile Access**: Users can view their complete history and analytics in their profile
5. **Cross-Device**: Data is stored on the server, so it's available from any device

## Troubleshooting

### Common Issues

1. **503 Service Unavailable**: The AI model is temporarily overloaded
   - Solution: Wait a few minutes and try again
   - The app will automatically retry up to 3 times

2. **429 Too Many Requests**: Rate limit exceeded
   - Solution: Wait before making new requests
   - Consider upgrading your API plan if this happens frequently

3. **API Key Errors**: Invalid or missing API key
   - Solution: Check your `.env` file and ensure the key is correct

4. **Data Not Persisting**: Interview results not showing in profile
   - Solution: Ensure you're logged in with the same account
   - Check that the backend server is running on port 5000
   - Verify database connection in server logs

### Performance Tips

- The app uses fallback questions and analysis when AI services are unavailable
- Retry delays increase exponentially (1s, 2s, 4s) to avoid overwhelming the service
- All API calls are wrapped with error handling and fallbacks
- User data is cached locally for better performance
- Analytics are calculated in real-time from stored data

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **interview_attempts**: Complete interview results and analytics
- **questions**: Question bank for different topics
- **question_usage**: Tracking of which questions users have seen

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- User data isolation (users can only see their own data)
- Secure API endpoints with token validation
