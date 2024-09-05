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


  