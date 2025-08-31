# Chatbot Setup Guide

## Prerequisites

1. **Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Environment Variables**: Add the following to your `.env` file:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Configuration (if not already set)
ACCESS_TOKEN_SECRET=your_access_token_secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## Installation

The chatbot system has been integrated with the following components:

### Backend
- **Socket.io server** for real-time communication
- **Chat model** for storing chat sessions and messages
- **Chatbot controller** with Gemini AI integration
- **Chat routes** for API endpoints

### Frontend
- **Chatbot component** with modern UI
- **Socket.io client** for real-time updates
- **Responsive design** for mobile and desktop

## Features

1. **Context-Aware**: The chatbot knows about the current topic, lesson, and subject
2. **Chat History**: All conversations are stored and can be retrieved
3. **Real-time Updates**: Uses Socket.io for instant messaging
4. **Responsive Design**: Works on all device sizes
5. **AI Integration**: Powered by Google's Gemini 2.5-flash model

## API Endpoints

- `POST /api/v1/chat/session` - Create or get chat session
- `POST /api/v1/chat/message` - Send message to chatbot
- `GET /api/v1/chat/session/:sessionId` - Get chat history
- `GET /api/v1/chat/sessions` - Get all chat sessions for student
- `DELETE /api/v1/chat/session/:sessionId` - Close chat session

## Usage

1. Navigate to any Material page with content URL
2. Click the chat bubble icon in the bottom right
3. Ask questions about your current lesson or topic
4. The chatbot will provide context-aware responses

## Database Schema

The system creates a new `chatsessions` collection with the following structure:

```javascript
{
  student: ObjectId,        // Reference to Student
  topic: ObjectId,          // Reference to Topic
  lesson: ObjectId,         // Reference to Lesson (optional)
  subject: ObjectId,        // Reference to Subject
  messages: [               // Array of chat messages
    {
      role: 'user' | 'assistant',
      content: String,
      timestamp: Date
    }
  ],
  context: {                // Context information
    currentContent: String,
    topicName: String,
    lessonName: String,
    subjectName: String
  },
  isActive: Boolean,
  timestamps: true
}
```

## Security

- All chat routes require authentication
- Students can only access their own chat sessions
- JWT token validation for Socket.io connections
- Input sanitization and validation

## Troubleshooting

1. **Chatbot not appearing**: Check if the Material component is properly importing the Chatbot
2. **API errors**: Verify your Gemini API key is set correctly
3. **Socket connection issues**: Check CORS configuration and JWT secret
4. **Database errors**: Ensure MongoDB connection is working

## Future Enhancements

- File upload support for sharing documents
- Voice message support
- Multi-language support
- Advanced analytics and insights
- Integration with other AI models
