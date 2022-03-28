const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());

//TODO: Implement books and pets APIs here
const booksRouter=require('./routers/books')
const petsRouter=require('./routers/pets')

app.use("/books", booksRouter)
app.use("/pets", petsRouter)


const port = 3030;
 
//Get the connection object to the database
const db = require("./utils/database");

//Start the server
app.listen(port, () => {

  //Connect to the database
  db.connect((error) => {

    //If there is an error connecting to the database, 
    //log it out to the console
    if (error) {
      console.error("[ERROR] Connection error: ", error.stack);
    } else {
      console.log("\n[DB] Connected...\n");
    }
  });

  console.log(`[SERVER] Running on http://localhost:${port}/`);
});
