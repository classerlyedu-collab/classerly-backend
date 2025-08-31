const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const chatMessageSchema = new Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSessionSchema = new Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lessons"
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject"
    },
    messages: [chatMessageSchema],
    context: {
        currentContent: String,
        topicName: String,
        lessonName: String,
        subjectName: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
chatSessionSchema.index({ student: 1, topic: 1, lesson: 1 });
chatSessionSchema.index({ student: 1, isActive: 1 });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
module.exports = ChatSession;
