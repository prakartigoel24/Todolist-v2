require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const db_url = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTERINFO}.mongodb.net/todolistDB`;
mongoose.connect(db_url);

const itemsSchema = {
  name:String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Default item 1"
});
const item2 = new Item({
  name : "Default item 2"
});
const item3 = new Item({
  name : "Default item 3"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List = mongoose.model("List", listSchema);
app.get("/", function(req, res) {


 Item.find({})
 .then((foundItems) => {
  if(foundItems.length===0)
  {
    Item.insertMany(defaultItems) 
    .then(() => {
      console.log("Successfully inserted items in DB.");
    })
    .catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  }
  else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
 })
 .catch((err) => {
  console.log(err);
 });


});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName})
  .then(function(foundList){
    if(!foundList)
    {
      const list = new List({
        name:customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }
    else{
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch((err)=>{
    console.log(err);
  })



});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });
  if(listName==="Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name:listName})
    .then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch((err) => {
      console.log(err);
    });
  }

});

app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName==="Today")
    {
      
          Item.findByIdAndRemove(checkedItemId)
          .then(() => {
            console.log("Successfully deleted checked item from DB.");
            res.redirect("/");
          })
          .catch((err) => {
            console.log(err);
          });
    }
    else
    {
      List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})     
      .then(()=>{
        res.redirect("/"+listName);
      })
      .catch((err)=>{
        console.log(err);
      }) 
    }
});

let port = process.env.PORT;

if(port == null || port == "")
{
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started successfully...");
});
