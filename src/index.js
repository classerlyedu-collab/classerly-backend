require('dotenv').config()
const port=process.env.PORT;
const app = require('./app');
const ConnectDB=require('./db/database')

ConnectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log("app is running at port",port);
    })
}).catch((error)=>{
    console.log("error in connection",error)
})





