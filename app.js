require('dotenv').config()                       // Acquiring dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app =express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  Email: String,
  Password: String
});
                                                 // Random Secret string for encryption
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["Password"]});                // encrypting the password fields of our entries


const User = new mongoose.model("User",userSchema);


app.get("/",function(req,res){
  res.render("home");
});

// Render register page
app.get("/register",function(req,res){
  res.render("register");
});

// render login page
app.get("/login",function(req,res){
  res.render("login");
});

//post request to register route (add a user Email and password)
app.post("/register",function(req,res){
  const userEntry = new User ({
    Email: req.body.username,
    Password: req.body.password
  });

  userEntry.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      res.render("secrets");
    }
  });
});

//post request to login route (check against email ID and pass in database if avalialbe then direct to secrets page)
app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({Email: username},function(err,result){
    if(err){
      console.log(err);
    }
    else{
      if(result){
        if(result.Password === password){
          res.render("secrets");
        }
        else{
          res.render("login");
        }
      }
      else{
        res.render("login");
      }
    }
  });
});

app.listen(3000,function(){
  console.log("Server started on port 3000");
})
