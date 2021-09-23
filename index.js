require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const Reminder = require("./model/reminderSchema");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));



setInterval(async () => {
  const reminderList = await Reminder.find({});
  // console.log(reminderList);
  reminderList.forEach(async (reminder) => {
    if (!reminder.isReminded) {
      const now = new Date();
      if (new Date(reminder.remindAt) - now < 0) {
        const remindObj = await Reminder.findByIdAndUpdate(reminder._id, {
          isReminded: true,
        });

        console.log(remindObj);
        //    Send Message
        const accountSid = process.env.ACCOUNT_SID;
        const authToken = process.env.AUTH_TOKEN;
        const client = require("twilio")(accountSid, authToken);

        client.messages
          .create({
            body: remindObj.reminderMsg,
            from: "whatsapp:+14155238886",
            to: "whatsapp:+917206151901",
          })
          .then((message) => console.log(message.sid))
          .done();
      }
    }
  });
}, 1000*60);

app.get("/getAllReminder", (req, res) => {
  Reminder.find({}, (err, reminderList) => {
    if (err) {
      console.log(err);
    }
    if (reminderList) {
      res.status(200).json({ status: "Success", message: reminderList });
    }
  });
});

app.post("/addReminder", async (req, res) => {
  const { reminderMsg, remindAt } = req.body;
  if (!reminderMsg || !remindAt) {
    return res
      .status(400)
      .json({ status: "error", message: "All Fields Required" });
  }

  const reminder = new Reminder({
    reminderMsg,
    remindAt,
    isReminded: false,
  });
  const data = await reminder.save();

  const reminderList = await Reminder.find({});

  if (reminderList) {
    res.status(200).json({ status: "Success", message: reminderList });
  }
});

app.post("/deleteReminder", (req, res) => {
  Reminder.deleteOne({ _id: req.body.id }, () => {
    Reminder.find({}, (err, reminderList) => {
      if (err) {
        console.log(err);
      }
      if (reminderList) {
        res.status(200).json({ status: "Success", message: reminderList });
      }
    });
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server is running at " + PORT);
});
