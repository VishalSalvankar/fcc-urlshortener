require('dotenv').config();
const express = require('express');
const cors = require('cors');
const validUrl = require('valid-url');
const shortId = require('shortid');
var bodyParser = require('body-parser')
const app = express();
const mongoose = require('mongoose');

// Basic Configuration
const port = 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
})

const URL = mongoose.model('URL', urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async(req, res) => {
  //console.log(req.body)
  const url = req.body.url;
  if(validUrl.isWebUri(url) == undefined){
    res.json({ error: 'invalid url' });
  } else {
    try{
      let shorturl = shortId.generate();
      let resUrl = await URL.findOne({ original_url: url});
      if(resUrl){
        res.json({
          original_url: resUrl.original_url,
          short_url: resUrl.short_url
        })
      } else{
        let newUrl = new URL({
          original_url: url,
          short_url: shorturl
        })
        let savedUrl = await newUrl.save();
        res.json({
          original_url: url,
          short_url: shorturl
        })
      }
    } catch(error){
      console.log(error);
      res.status(500).json('Server error!');
    }
  }
})

app.get('/api/shorturl/:shorturl', async(req, res) => {
  let urlRes = await URL.findOne({ short_url: req.params.shorturl });
  if(urlRes){
    res.redirect(urlRes.original_url);
  } else {
    res.status(404).json('URL not found');
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
