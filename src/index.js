require('dotenv').config()
const port = process.env.PORT;
const app = require('./app');
const ConnectDB = require('./db/database');
const { initializeSocket } = require('./socket');

ConnectDB()
    .then(() => {
        const server = app.listen(port, () => {
            console.log("app is running at port", port);
        });

        // Initialize Socket.io
        initializeSocket(server);
        console.log("Socket.io initialized");
    }).catch((error) => {
        console.log("error in connection", error)
    })





