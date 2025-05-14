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


  const requestSchema=new mongoose.Schema({
    name:{type:String,required:true},
    date: { type: Date, required: true },
    slot:{type:String,required:true}

});

const adminSchema=new mongoose.Schh=ema({
   name:{type:String,required:true},
   department:{type:String,required:true},
   equipment:{type:String,required:true},
   request:[requestSchema]
  })


  const Admin = mongoose.model('Admin',adminSchema);






  