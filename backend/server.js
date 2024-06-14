require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron'); // Importing the cron module
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
const jwt = require('jsonwebtoken');
const app = express();


const db_link ="mongodb+srv://admin:XOxVmeaMa7cvRdgI@cluster1.3u5vmm7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";




mongoose.connect(db_link)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });


// Middleware to parse JSON
app.use(express.json());


app.use(cors());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));



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
  days: [daySchema]
});

// Define the department schema
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  equipments: [equipmentSchema]
});

// Create and export the department model
const Department = mongoose.model('Department', departmentSchema);






const userRouter = express.Router();
app.use('/user', userRouter);

const bookingSchema = new mongoose.Schema({
  department:{ type:String, required: true},
  equipment:{ type:String, required: true},
  date:{ type: Date, required: true },
  slot:{ type:String, required: true}
  
  }
);


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
  bookings:[bookingSchema]
  
});

const User = mongoose.model('User', userSchema);



//login functionn 
userRouter.post('/login', async (req, res) => {
  const { username, password, email } = req.body;
   console.log(username,password,email);
  try {
    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username/email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid username/email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});







// Registration
userRouter.post('/register', async (req, res) => {
  const { username, password , email} = req.body;

   console.log(username,password,email)
  try {
    // Check if user already exists by username or email
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'User with this username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

















const bookingRouter = express.Router();
app.use('/booking', bookingRouter);


// Define the slot schema






bookingRouter.patch('/', async (req, res) => {
  const { email, department, equipment, date, slot } = req.body;

  console.log(email,department, equipment, date, slot);
  const departmentName = department;
  const equipmentName = equipment;
 

  try {
    // Find the department
    const departmentDoc = await Department.findOne({ name: departmentName });
    if (!departmentDoc) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Find the equipment within the department
    const equipmentDoc = departmentDoc.equipments.find(e => e.name === equipmentName);
    if (!equipmentDoc) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    // Find the day entry for the specified date
    const dateToBook = new Date(date); // Assuming 'date' is in ISO 8601 format (e.g., "YYYY-MM-DD")

// Ensure dateToBook is in UTC format for comparison
   const isoDateToBook = dateToBook.toISOString().slice(0, 10); // "YYYY-MM-DD"

   // Adjust query to match UTC date format
    dayEntry = equipmentDoc.days.find(day => day.date.toISOString().slice(0, 10) === isoDateToBook);
    console.log(dayEntry);
    if (!dayEntry) {
      return res.status(404).json({ error: "Date entry not found" });
    }

    // Validate the slot name
    const validSlots = ['slot1', 'slot2', 'slot3', 'slot4'];
    if (!validSlots.includes(slot)) {
      return res.status(400).json({ error: "Invalid slot name" });
    }

    // Update the specified slot
    if (dayEntry.slots[slot]) {
      return res.status(400).json({ error: "Slot already booked" });
    }
    
    dayEntry.slots[slot] = true;

    // Save the updated department document
    await departmentDoc.save();

    // Find the user and update their bookings
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.bookings.push({
      department: departmentName,
      equipment: equipmentName,
      date: dateToBook,
      slot: slot
    });

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: "Slot booked successfully", bookings: user.bookings });

  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});








// getting dates for the equipment
bookingRouter.get('/:department/:equipment', async (req, res) => {
  const { department, equipment } = req.params;

  try {
    const departmentDoc = await Department.findOne({ name: department });
    if (!departmentDoc) {
      return res.status(404).json({ error: "Department not found" });
    }

    const equipmentDoc = departmentDoc.equipments.find(e => e.name === equipment);
    if (!equipmentDoc) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.status(200).json(equipmentDoc.days);
  } catch (error) {
    console.error("Error fetching equipment days and slots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



//getting all the equipments

bookingRouter.get('/:departmentName', async (req, res) => {
  const { departmentName } = req.params;

  try {
    const departmentDoc = await Department.findOne({ name: departmentName });
    if (!departmentDoc) {
      return res.status(404).json({ error: "Department not found" });
    }

    const equipmentList = departmentDoc.equipments.map(equipment => equipment.name);
    res.status(200).json({ department: departmentName, equipment: equipmentList });
  } catch (error) {
    console.error("Error fetching equipment list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





// GET request to fetch list of all departments
bookingRouter.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    const departmentList = departments.map(department => department.name);
    res.status(200).json({ departments: departmentList });
  } catch (error) {
    console.error("Error fetching department list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



//code to add department only for admin side   
bookingRouter.post('/add-department', async (req, res) => {
  const { name } = req.body;

  try {
    // Check if the department already exists
    let department = await Department.findOne({ name });
    if (department) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    // Create new department with no equipments
    department = new Department({
      name,
      equipments: []
    });

    // Save the new department
    await department.save();

    res.status(201).json({ message: 'Department added successfully', department });
  } catch (err) {
    console.error('Error adding department:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





//code to add equipment 
bookingRouter.post('/add-equipment', async (req, res) => {
  const { departmentName, equipmentName } = req.body;

  try {
    // Find the department by name
    const department = await Department.findOne({ name: departmentName });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if the equipment already exists in the department
    const existingEquipment = department.equipments.find(e => e.name === equipmentName);
    if (existingEquipment) {
      return res.status(400).json({ message: 'Equipment already exists in this department' });
    }

    // Create the next 60 days schedule with all slots set to false
    const today = new Date();
    const days = [];
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        slots: {
          slot1: false,
          slot2: false,
          slot3: false,
          slot4: false
        }
      });
    }

    // Add new equipment to the department
    const newEquipment = {
      name: equipmentName,
      days: days
    };
    department.equipments.push(newEquipment);

    // Save the updated department
    await department.save();

    res.status(201).json({ message: 'Equipment added successfully', department });
  } catch (err) {
    console.error('Error adding equipment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});









// Function to update days
async function updateDays() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 60);

  try {
    const departments = await Department.find();
    for (const department of departments) {
      for (const equipment of department.equipments) {
        // Delete today's record
        equipment.days = equipment.days.filter(day => day.date.toISOString().slice(0, 10) !== today.toISOString().slice(0, 10));

        // Add new record for 60 days in the future
        equipment.days.push({
          date: futureDate,
          slots: { slot1: false, slot2: false, slot3: false, slot4: false }
        });
      }
      await department.save();
    }
    console.log('Days updated successfully');
  } catch (error) {
    console.error('Error updating days:', error);
  }
}

// Schedule the task to run every day at 11:00 PM
cron.schedule('46 23 * * *', updateDays);






app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
