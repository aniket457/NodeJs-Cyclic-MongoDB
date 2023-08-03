//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hello",
});

const item3 = new Item({
  name: "There",
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems)
//   .then(function () {
//     console.log("Succesfully saved all the items to todolisDB");
//   })
//   .catch(function (err) {
//     console.log(err);
//   });

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Succesfully saved all the items to todolisDB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (foundList) {
        // show an already existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(() => {
      console.log("Successfully deleted checked item");
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then(function (foundList) {
      if (foundList) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
