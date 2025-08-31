const mongoose = require('mongoose');
const mongo_uri = process.env.MONGO_URI;

const ConnectDB = async () => {
    try {
        await mongoose.connect(mongo_uri, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Error in connecting database:", error);
        throw error; // rethrow so index.js can catch
    }
};

module.exports = ConnectDB;