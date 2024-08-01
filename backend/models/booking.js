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

// Define the slot schema


const slotSchema = new mongoose.Schema({
  slot1: { type: Boolean, default: false },
  slot2: { type: Boolean, default: false },
  slot3: { type: Boolean, default: false },
  slot4: { type: Boolean, default: false }
});

// Define the day schema
const daySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  slots: slotSchema
});

// Define the equipment schema
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminName:{type:String,required:true},
  days: [daySchema]
});

// Define the department schema
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  equipments: [equipmentSchema]
});

// Create the department model
const Department = mongoose.model('Department', departmentSchema);


const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  slot: { type: String, required: true }
});

const equipment=new mongoose.Schema({
    name:{type:String,required:true},
    request:[requestSchema]
})


const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String},
  equipment:[equipment]
});

const Admin = mongoose.model('Admin', adminSchema);





async function createElectricalDepartment() {
  try {
    const adminName = 'adminA';
    const departmentName = 'Electrical';

    // Find the admin
    const admin = await Admin.findOne({ name: adminName });
    if (!admin) {
      throw new Error(`Admin with name ${adminName} not found`);
    }

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create slots for the next 60 days starting from tomorrow
    const days = [];
    for (let i = 0; i < 60; i++) {
      const date = new Date(tomorrow);
      date.setDate(date.getDate() + i);

      days.push({
        date,
        slots: {
          slot1: false,
          slot2: false,
          slot3: false,
          slot4: false
        }
      });
    }

    // Create the department data
    const departmentData = {
      name: departmentName,
      equipments: [
        {
          name: '3-D Printer',
          adminName: admin.name,
          days
        }
      ]
    };

    admin.equipment.push({
      name:"3-D Printer",
    });


    // Create a new department
    const newDepartment = new Department(departmentData);
    const savedDepartment = await newDepartment.save();

    // Update the admin's department field
    admin.department = departmentName;
    await admin.save();

    console.log('Electrical department created:', savedDepartment);
    console.log(`Admin ${adminName} updated with department ${departmentName}`);
  } catch (error) {
    console.error('Error creating electrical department:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close()
      .then(() => console.log("DB connection closed"))
      .catch(err => console.error('Error closing DB connection:', err));
  }
}
createElectricalDepartment();