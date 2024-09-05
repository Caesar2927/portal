const mongoose = require('mongoose');

const db_link = 'mongodb+srv://admin:XOxVmeaMa7cvRdgI@cluster1.3u5vmm7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

mongoose.connect(db_link)
  .then(() => {
    console.log("DB connected");

    const Department = mongoose.model('Department');

    const departmentName = "Electrical"; // Assuming this is the department name
    const equipmentName = "3-D Printer"; // Assuming this is the equipment name
    const dateToBook = new Date("2024-06-30"); // Date to book the slot (converted to Date object)

    Department.findOne({ name: departmentName })
      .then(department => {
        if (!department) {
          console.error("Department not found");
          return;
        }

        const equipment = department.equipments.find(e => e.name === equipmentName);
        if (!equipment) {
          console.error("Equipment not found");
          return;
        }

        // Find the day entry for the specified date
        const dayEntry = equipment.days.find(day => day.date.toISOString().slice(0, 10) === dateToBook.toISOString().slice(0, 10));
        if (!dayEntry) {
          console.error("Date entry not found");
          return;
        }

        // Update the slots for the specified date
        // For example, let's assume you want to book slot1
        dayEntry.slots.slot1 = true;

        // Save the changes
        department.save()
          .then(() => {
            console.log("Slot booked successfully fron trials  ");
            mongoose.connection.close();
          })
          .catch(error => {
            console.error("Error saving department:", error);
            mongoose.connection.close();
          });
      })
      .catch(error => {
        console.error("Error finding department:", error);
      });
  })
  .catch((err) => {
    console.log(err);
  });
