const express = require('express')
const app = express();
const bodyParser= require('body-parser');
const cors = require("cors");
const req = require('express/lib/request');
const env = require('dotenv').config()
const port = 3000
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
app.set('trust proxy', true);

const MongoClient = require('mongodb').MongoClient
var db, quotesCollection;
MongoClient.connect(`mongodb+srv://kirana:${process.env.DB_PASS}@cluster0.reftijg.mongodb.net/?retryWrites=true&w=majority`, (err, client) => {
  if(err) console.log(err);
  db = client.db('kirana_data')
  quotesCollection = db.collection('prices')
  console.log("db connected");
})

app.use(express.static('public'));

app.options('*', cors());

app.all('/', cors(), function (req, res) {
  res.sendFile('index.html', {root: './public/'});
});

app.get('/home', cors(), (req, res) => {
  res.redirect("/");
  // res.sendFile('index.html', {root: './public/'});
})


app.get('/list', cors(), (req, res) => {
  quotesCollection.find().toArray()
  .then(results => {
    res.json(results)
  })
  .catch(error => console.error(error)) 
})

app.post('/add-items', cors(), (req, res) => {
  console.log(req.body);
  quotesCollection.insert(req.body)
  .then(results => {
    res.status(201).send(results)
  })
  .catch(error => {
    if(error.code ===11000){
      var errorResponse = [];
      error.writeErrors.forEach(element => {
      errorResponse = [...errorResponse, {"msg":`Item already exists.`, "index" : element.index}];
      error = errorResponse
     });
    }   
    res.status(400).send({"errors":error});
  }) 
})

app.put('/update', cors(), (req, res) => {
  var name = req.body.name;
  if(!name) res.status(400).send({"errors":["Name of item is missing."]});
  var data = req.body;
  delete data.name
  quotesCollection.updateOne( 
    { "name" : name },{$set: data} )
  .then(results => {
    res.status(200).send(results)
  })
  .catch(error => {
    res.status(400).send({"errors":error});
  }) 
})

app.delete('/delete/:name', (req, res) => {
  var name = req.params.name;
  if(!name) res.status(400).send({"errors":["Name of item is missing."]});
  quotesCollection.deleteOne( 
    { "name" : name })
  .then(results => {
    res.status(200).send(results)
  })
  .catch(error => {
    res.status(400).send({"errors":error});
  }) 
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App listening on port ${process.env.PORT || 3000}`)
})