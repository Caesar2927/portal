const mongoose = require('mongoose');

const db_link = 'mongodb+srv://admin:XOxVmeaMa7cvRdgI@cluster1.3u5vmm7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

mongoose.connect(db_link)
  .then(() => {
    console.log("DB connected");
    createElectricalDepartment();
  })
  .catch((err) => {
    console.log(err);
  });



const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
    },
    
    email:{
      type:String,
      required: true,
      unique: true,
  
    },
  
    password: {
      type: String,
      required: true,
    },
  });
  
  const User = mongoose.model('User', userSchema);