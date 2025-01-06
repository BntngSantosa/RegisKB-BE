require("dotenv").config();
const express = require("express");
const remindersRoutes = require("./routes/reminders");
const getReminderRoutes = require("./routes/getReminderById");
const updateReminderRoutes = require("./routes/updateReminderById");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors());

app.use("/api", remindersRoutes);
app.use("/api", getReminderRoutes);
app.use("/api", updateReminderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
