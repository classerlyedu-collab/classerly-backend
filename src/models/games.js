const mongoose=require('mongoose');

const gamesSchema=new mongoose.Schema({
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "Teacher"
    },
  
    grade:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "Grade"
    },
    topic:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "Topic"
    },
    
    subject:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "subject"
    },
 
    // startsAt:{
    //     type:Date
    // },
    // endsAt:{
    //     type:Date
    // },
    image:String,
    title:String,

    status: {
        type: String,
        enum: ["pending", "start", "complete"],
        default: "pending",
      },
    score:Number
},{
    timestamps:true
    })

const gamesModel=mongoose.model("games",gamesSchema);
module.exports=gamesModel;