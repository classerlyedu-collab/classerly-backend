const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatSession = require('../models/chat');
const Topic = require('../models/topic');
const LessonsModel = require('../models/LessonsModel');
const Subject = require('../models/subject');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { extractGoogleDocsContent, isGoogleDocsUrl } = require('../utils/googleDocsExtractor');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get or create chat session
exports.getOrCreateChatSession = asyncHandler(async (req, res) => {
    const { topicId, lessonId, subjectId } = req.body;
    const studentId = req.user.profile._id;

    if (!topicId || !studentId) {
        return res.status(400).json(new ApiResponse(400, "Topic ID and student ID are required"));
    }

    try {
        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(topicId)) {
            return res.status(400).json(new ApiResponse(400, "Invalid topic ID format"));
        }
        if (lessonId && !mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json(new ApiResponse(400, "Invalid lesson ID format"));
        }
        if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json(new ApiResponse(400, "Invalid subject ID format"));
        }

        // Get topic and lesson details for context
        const topic = await Topic.findById(topicId).populate('subject');
        const lesson = lessonId ? await LessonsModel.findById(lessonId) : null;
        const subject = subjectId ? await Subject.findById(subjectId) : lesson?.topic ? await Topic.findById(lesson.topic).populate('subject') : null;

        // Enhanced content extraction
        let documentContent = '';
        let contentSource = '';

        if (lesson?.content) {
            // Check if lesson content is a Google Docs URL
            if (isGoogleDocsUrl(lesson.content)) {
                try {
                    const extractedContent = await extractGoogleDocsContent(lesson.content);
                    if (extractedContent) {
                        documentContent = extractedContent;
                        contentSource = 'google_docs_extracted';
                    } else {
                        documentContent = `Google Docs URL: ${lesson.content}\n\nNote: Content extraction failed.`;
                        contentSource = 'google_docs_failed';
                    }
                } catch (extractError) {
                    documentContent = `Google Docs URL: lesson.content}\n\nNote: Content extraction failed due to error.`;
                    contentSource = 'google_docs_error';
                }
            } else {
                // If lesson has direct text content
                documentContent = lesson.content;
                contentSource = 'lesson_content';
            }
        } else if (req.body.contentUrl) {
            // If content URL is provided (like Google Docs)
            if (isGoogleDocsUrl(req.body.contentUrl)) {
                try {
                    const extractedContent = await extractGoogleDocsContent(req.body.contentUrl);
                    if (extractedContent) {
                        documentContent = extractedContent;
                        contentSource = 'google_docs_extracted';
                    } else {
                        documentContent = `Content from: ${req.body.contentUrl}\n\nNote: Content extraction failed.`;
                        contentSource = 'google_docs_failed';
                    }
                } catch (extractError) {
                    documentContent = `Content from: ${req.body.contentUrl}\n\nNote: Content extraction failed due to error.`;
                    contentSource = 'google_docs_error';
                }
            } else {
                documentContent = `Content from: ${req.body.contentUrl}`;
                contentSource = 'external_url';
            }
        } else if (lesson?.image) {
            // If lesson has an image
            documentContent = `Image content: ${lesson.image}`;
            contentSource = 'image';
        }

        if (!topic) {
            return res.status(404).json(new ApiResponse(404, "Topic not found"));
        }

        // Find existing active session or create new one
        let chatSession = await ChatSession.findOne({
            student: studentId,
            topic: topicId,
            lesson: lessonId,
            isActive: true
        });

        if (!chatSession) {
            chatSession = new ChatSession({
                student: studentId,
                topic: topicId,
                lesson: lessonId,
                subject: subject?._id || topic.subject,
                context: {
                    currentContent: documentContent,
                    contentSource: contentSource,
                    topicName: topic.name,
                    lessonName: lesson?.name || '',
                    subjectName: subject?.name || topic.subject?.name || '',
                    contentUrl: req.body.contentUrl || lesson?.content || ''
                },
                messages: []
            });
            await chatSession.save();
        } else {
            // Update existing session with new content
            chatSession.context.currentContent = documentContent;
            chatSession.context.contentSource = contentSource;
            chatSession.context.contentUrl = req.body.contentUrl || lesson?.content || '';
            await chatSession.save();
        }

        return res.status(200).json({
            success: true,
            data: chatSession,
            message: "Chat session retrieved/created successfully"
        });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});

// Send message to chatbot
exports.sendMessage = asyncHandler(async (req, res) => {
    const { sessionId, message, topicId, lessonId } = req.body;
    const studentId = req.user.profile._id;

    if (!message || !sessionId) {
        return res.status(400).json(new ApiResponse(400, "Message and session ID are required"));
    }

    try {
        // Find the chat session and populate with latest content
        const chatSession = await ChatSession.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json(new ApiResponse(404, "Chat session not found"));
        }

        // If this is a Google Docs session, refresh the content
        if (chatSession.context.contentSource === 'google_docs_extracted' &&
            (chatSession.context.contentUrl || chatSession.context.actualLessonContent)) {
            const urlToRefresh = chatSession.context.contentUrl || chatSession.context.actualLessonContent;
            try {
                const refreshedContent = await extractGoogleDocsContent(urlToRefresh);
                if (refreshedContent) {
                    chatSession.context.currentContent = refreshedContent;
                }
            } catch (refreshError) {
                // Use existing content if refresh fails
            }
        }

        // Verify the session belongs to the student
        if (chatSession.student.toString() !== studentId.toString()) {
            return res.status(403).json(new ApiResponse(403, "Access denied"));
        }

        // Add user message to session
        chatSession.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Prepare enhanced context for Gemini
        const context = `You are an educational AI assistant helping a student with their studies. 
    
Current Context:
- Subject: ${chatSession.context.subjectName || 'Not specified'}
- Topic: ${chatSession.context.topicName || 'Not specified'}
- Lesson: ${chatSession.context.lessonName || 'Not specified'}
- Content Source: ${chatSession.context.contentSource || 'Not specified'}
- Content URL: ${chatSession.context.contentUrl || 'Not specified'}

IMPORTANT: You have access to the full document content below. Use this content to answer questions about the document:

Document Content:
${chatSession.context.currentContent || 'No document content available'}

Previous conversation context:
${chatSession.messages.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Instructions: 
- You HAVE ACCESS to the document content above. Use it to answer questions about the document.
- If a student asks about specific sections or content, reference the actual text from the document.
- Be helpful, educational, and concise.
- Quote relevant parts of the document when answering questions.
- Do NOT say you don't have access to the document - you do!`;

        // Generate response using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });



        const result = await model.generateContent(context + `\n\nStudent: ${message}\n\nAssistant:`);
        const response = await result.response;
        const aiResponse = response.text();

        // Add AI response to session
        chatSession.messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });

        await chatSession.save();

        return res.status(200).json({
            success: true,
            data: {
                sessionId: chatSession._id,
                message: aiResponse,
                timestamp: new Date()
            },
            message: "Message sent successfully"
        });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Error generating response"));
    }
});

// Get chat history
exports.getChatHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const studentId = req.user.profile._id;

    try {
        const chatSession = await ChatSession.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json(new ApiResponse(404, "Chat session not found"));
        }

        // Verify the session belongs to the student
        if (chatSession.student.toString() !== studentId.toString()) {
            return res.status(403).json(new ApiResponse(403, "Access denied"));
        }

        return res.status(200).json({
            success: true,
            data: chatSession,
            message: "Chat history retrieved successfully"
        });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});

// Get all chat sessions for a student
exports.getStudentChatSessions = asyncHandler(async (req, res) => {
    const studentId = req.user.profile._id;

    try {
        const chatSessions = await ChatSession.find({
            student: studentId,
            isActive: true
        }).populate('topic', 'name').populate('lesson', 'name').populate('subject', 'name')
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            data: chatSessions,
            message: "Chat sessions retrieved successfully"
        });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});

// Close chat session
exports.closeChatSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const studentId = req.user.profile._id;

    try {
        const chatSession = await ChatSession.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json(new ApiResponse(404, "Chat session not found"));
        }

        // Verify the session belongs to the student
        if (chatSession.student.toString() !== studentId.toString()) {
            return res.status(403).json(new ApiResponse(403, "Access denied"));
        }

        chatSession.isActive = false;
        await chatSession.save();

        return res.status(200).json({
            success: true,
            message: "Chat session closed successfully"
        });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});
