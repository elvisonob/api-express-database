const express = require("express")

const booksRouter = express.Router()

//Required our database - this db variable
//is actually a "Client" object from the
//node postgres library: https://node-postgres.com/api/client
const db = require("../utils/database")

//GET /books - getting all books from the database
booksRouter.get("/", (req, res) => {

  //The SQL Query we want to run
  let selectAllBooksQuery = "SELECT * FROM books"

  //Support for optional query parameters. Depending on the combination
  //of parameters supplied, we want to generate different where clauses:
  // 
  //  /books                                - SELECT * FROM books
  //  /books?type=fiction                   - SELECT * FROM books WHERE type='Fiction'
  //  /books?topic=history                  - SELECT * FROM books WHERE topic='history'
  //  /books?type=Non-Fiction&topic=history - SELECT * FROM books WHERE topic='history AND type='Non-Fiction'
  
  //Create an array to store the values we'll provide to the database as 
  //our query place holder params (the values for $1, $2 etc.). These will be
  //different depending on what query string filters the client specifies
  const selectValues = []

  //We'll use this array to keep track of the where clauses we need to add
  //as we check the query parameters. For every WHERE clause we need to add
  //we'll record the column we want to query, and also the value we want to
  //search for on that column
  const queries = []

  //If there is a type query param present (i.e. /books?type=fiction) then
  //add that to our queries array
  if(req.query.type) {
    queries.push({col:'type', val: req.query.type})
  }

  //If there is a topic query param present (i.e. /books?topic=horror) then
  //add that to our queries array
  if(req.query.topic) {
    queries.push({col:'topic', val: req.query.topic})
  }
  
  //If we have any queries specified, then update our SQL statement
  //to add the WHERE clauses we need, and also update the selectValues
  //array to contain the actual values we want to use in place of the 
  //$1, $2 etc.
  if(queries.length>0) {

    let whereClauses = []
    
    //For each query, add the WHERE clause we'll need in to the whereClauses array
    //
    //For example, if queries contains:
    // [ { col:'type', vale:'Fiction'} ]
    //we will generate: 
    // [ 'type = $1' ]
    //
    //If queries contains:
    // [ { col:'type', vale:'Fiction'}, { col:'topic', value:'horror'} ]
    //we will generate: 
    // [ 'type = $1', 'topic = $2' ]
    //
    queries.forEach( (query, index) => {
      
      //Get index+1, because we want our placeholders ($1, $2) etc. to start at 
      //1, not 0 like the array index
      whereClauses.push(`${query.col} = $${index+1}`)

      //Add the value of the query in to the selectValues array. This make sure
      //that the indexes of the values in the array match up with the place holder
      //values we are generating on the line above.
      selectValues.push(query.val) 
    })
      
    //Update our SQL statement to add on the WHERE clauses
    //we've created in the whereClauses array - we use join so that
    //' AND ' is used to separate each clause (note the spaces).
    selectAllBooksQuery += ' WHERE ' + whereClauses.join(' AND ')
  }
  
  console.log(selectValues)
  console.log(selectAllBooksQuery)

  //Using the query method to send a SQL query
  //to the database. This is asynchronous - so
  //we use our "then" callbacks to handle the
  //response
  db.query(selectAllBooksQuery, selectValues)
    .then((databaseResult) => {
      //Log the result to the console
      //console.log(databaseResult)
      //Send back the rows we got from the query
      //to the client
      res.json({ books: databaseResult.rows })
    })
    //If there is a database error, the callback
    //we provide to catch will be called. In this
    //case we want to send the client a 500 (server error)
    //and log out the message
    .catch((error) => {
      res.status(500)
      res.json({ error: "unexpected Error" })
      console.log(error)
    })
})

//GET /books/:id - loads a single book by id
booksRouter.get("/:id", (req, res) => {
  //The query we want to run - in this case the id of the book we
  //are looking for will come from the request URL. We don't want
  //to add it to the query directly, instead we use $1 as a place
  //holder
  const selectSingleBookQuery = "SELECT * FROM books WHERE id = $1"

  //Create an array of values to use instead of the placeholders
  //in the above query. When the database runs the query, it will
  //replace the $ placeholders with the values from this array.
  //
  //$1 will be replaced by the first value in the array
  //$2 (if we had one for this query) would be replaced by
  //the second value in the array
  //$3 by the third, etc.
  const queryValues = [
    req.params.id, //$1 = book id
  ]

  //Run the query, passing our query values as a second argument
  //to db.query
  db.query(selectSingleBookQuery, queryValues)
    .then(function (databaseResult) {
      //If we book was not found, return a 404
      if (databaseResult.rowCount === 0) {
        res.status(404)
        res.json({ error: "book does not exist" })
      } else {
        //If the book was found, return it
        res.json({ book: databaseResult.rows[0] })
      }
    })
    .catch((error) => {
      res.status(500)
      res.json({ error: "unexpected error" })
      console.log(error)
    })
})

//DELETE /books/10
booksRouter.delete("/:bookId", (req, res) => {
  const deleteBooksQuery = `DELETE FROM books WHERE id = $1 RETURNING *`

  const deleteValues = [
    req.params.bookId, //$1 - the book Id
  ]

  db.query(deleteBooksQuery, deleteValues)
    .then((databaseResult) => {
      if (databaseResult.rowCount === 0) {
        res.status(404)
        res.json({ error: "book does not exist" })
      } else {
        res.json({ book: databaseResult.rows[0] })
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(500)
      res.json({ error: "unexpected error" })
    })
})

booksRouter.put("/:bookId", (req, res) => {
  
  const updateBooksQuery = `
    UPDATE books SET 
      title = $1,
      type = $2,
      author = $3,
      topic = $4,
      publicationDate = $5,
      pages = $6
    WHERE id = $7
    RETURNING *`

  const updateValues = [
    req.body.title, //$1 = title
    req.body.type, //$2 = type
    req.body.author, //$3 = author
    req.body.topic, //$4 = topic
    req.body.publicationDate, //$5 = publicationDate
    req.body.pages, //$6 = pages
    req.params.bookId, //$7 = bookId
  ]

  db.query(updateBooksQuery, updateValues)
    .then(databaseResult => {
      console.log(databaseResult)
      if(databaseResult.rowCount===0) {
        res.status(404)
        res.json({error: 'book does not exist'})
      }
      else {
        res.json({book: databaseResult.rows[0]})
      }
    })
    .catch(error => {
      console.log(error)
      res.status(500)
      res.json({error: 'unexpected error'})
    })

})

//POST /books - Adds a new book
booksRouter.post("/", (req, res) => {
  //The query we want to run - in this case we want to do an
  //INSERT to add a new book to the database. The values we
  //are inserting will come from the request body so we'll use
  //the $ placeholder values again. In this case we have 6 of them!
  //
  //RETURNING * tells postgres we want it to return the newly added
  //book to us as the query response (by default, an INSERT will )
  //return nothing. This allows us to send the book back to the
  //client in the API response
  const insertBooksQuery = `
    INSERT INTO books(
      title, 
      type, 
      author,
      topic, 
      publicationDate, 
      pages)
    VALUES($1, $2, $3, $4, $5, $6)
    RETURNING *`

  //The values we want to use in place of the $ placeholders above
  //in the INSERT query.
  const bookValues = [
    req.body.title, //$1 = title
    req.body.type, //$2 = type
    req.body.author, //$3 = author
    req.body.topic, //$4 = topic
    req.body.publicationDate, //$5 = publicationDate
    req.body.pages, ///$6 = pages
  ]

  //Run the query passing in the values we want to use
  //instead of the placeholders as the second argument
  db.query(insertBooksQuery, bookValues)
    .then((databaseResult) => {
      console.log(databaseResult)
      res.json({ book: databaseResult.rows[0] })
    })
    .catch((error) => {
      console.log(error)
      res.status(500)
      res.json({ error: "unexpected error" })
    })
})

//DELETE


module.exports = booksRouter