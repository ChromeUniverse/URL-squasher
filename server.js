const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const port = 8080;

const filepath = 'urls.csv';

app.use(express.static('static'))
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: true }));

// regex magic to remove whitespaces
function invalid(url) {
  // let url_empty = url.replace(/\s/g, '').length == 0;
  // if (url_empty) {return true}  
  // if (url.includes(',') || url.includes(' ')) {return true}  


  // regular expression matching rules
  let regex = '((http|https)://)(www.)?'
  + '[a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]'
  + '{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)';
  
  if (url.match(regex) === null) {
    console.log('invalid!');
    return true;    
  }
  if (url.length > 500){
    console.log('too long!');
    return true;    
  }
  else {
    console.log('valid!');
    return false;
  }
}


// generate unique ID
function getUniqueID() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }                                  
  return s4();
}



// GET requests to '/' -> Index
app.get('/', (req, res) => {
  res.status(200);
  res.sendFile(__dirname + '/static/index.html');
})

// GET requests to '/pro' -> rickroll lmao
app.get('/pro', (req, res) => {
  res.redirect(301, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
})

// GET requests to '/a*' -> redirect
app.get('/x*', (req, res) => {   

  let id = req.url.slice(2,6);
  console.log('got ID:', id);

  let url = false;

  fs.createReadStream(filepath)
  .pipe(csv())
  .on('data', function(row) {          
    console.log('Trying to match this row:', row);
    if (row.ID == id){      
      url = row.URL;
      console.log('Found it!!!');
    }  
  })
  .on('end', function () {    
    if (url != false) {
      res.redirect(301, url);
    } else {
      res.status(404);
      res.send("Sorry, couldn't find that.");
    }
    
  })

  
  

  
})

// POST request to /
app.post('/', (req, res) => {

  // parsing form data
  let formData = req.body;
  let url = formData['url'];
  console.log('got url to squash:', url);  

  // checking for invalid urls
  if (invalid(url)) {
    res.status(200);  
    res.sendFile(__dirname + '/static/invalid.html');
    return;
  } else { 
    
    let entries = [];

    // let newID = getUniqueID();
        
    let squashedURL = 'is this even working?';
    let lastID;        

    fs.createReadStream(filepath)
    .pipe(csv())
    .on('data', function(row) {              
      entries.push(row);
      lastID = row.ID;          
    })

    .on('end', function () {

      console.log('\nDone extracting, apparently?');

      let newID = (parseInt('0x' + lastID) + 1).toString(16);
      squashedURL = 'http://192.168.1.109:' + port + '/x' + newID;
      console.log('Squashed URL is:', squashedURL);

      let new_entry = {
        ID: newID.toString(),
        URL: url.toString()
      }      

      entries.push(new_entry);        
      console.table(new_entry);

      let file_string = '';
      file_string += 'ID,URL\n';  // header

      entries.forEach(e => {
        let new_entry = e.ID + ',' + e.URL + '\n';
        file_string += new_entry;
      });

      console.log('\nHere is file to write:\n', file_string);

      // let file_string = 'NAME,ID,SCHOOL\nLucca,4017,UC Berkeley\n'
      // let file_string = addStudentCSV(student);
      // addStudentCSV(student);
      // console.log('New file is here:\n', file_string);
      
      fs.writeFile(filepath, file_string, err => {
        // console.log('got here');
        if (err) {
          console.log('Error writing to CSV!\n');
        } else {
          console.log('Successfully wrote to CSV\n');
      }
      })

      res.status(200);
      let data = fs.readFileSync(__dirname + '/static/squashed.html');
      res.send(data.toString().replace("RESULT", squashedURL));

    })
    
  }

})













// Start server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
})