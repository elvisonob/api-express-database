const express=require('express')
const db=require('../utils/database')

const booksRouter=express.Router()

//using get method to the homepage router
booksRouter.get('/', (req, res) => {
    //'SELECT * FROM books' is a syntax we use for SQL to get all contents
    const selectAllBooksQuery = "SELECT * FROM books"

     //db.query is another way to use fetch
    db.query(selectAllBooksQuery)
    .then(databaseResult=> {
        console.log(databaseResult)
    //this is a json we are sending
        res.json({books: databaseResult.rows})
    })
    //incase there is an error, we are expecting the 500 status to be sent and with json, an unexpected error
    .catch(error=> {
        res.status(500)
        res.json({error: 'Unexpected Error'})
        console.log(error)
    })
})

//I am still going through this Post session to get a good understanding and grasp of it.
//Firstly, we are making a post request to the homepage with just the '/' as route
booksRouter.post('/', (req, res) => {

     //I have a little idea why we are doing this or even using the backtick
    const insertBooksQuery =`INSERT INTO books(title,type, author, topic, publicationDate, pages) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`

        const bookValues=[
            req.body.title,
            req.body.type,
            req.body.author,
            req.body.topic,
            req.body.publicationDate,
            req.body.pages
        ]

        db.query(insertBooksQuery, bookValues)
        .then(databaseResult=> {
            console.log(databaseResult)
            res.json({book:databaseResult.rows[0]})
        })
        .catch(error=> {
            console.log(error)
            res.status(500)
            res.json({error:'unexpected error'})
        })
})


//DELETE

//I am making a delete method here with a book param.
booksRouter.delete('/:bookId', (req, res) => {
    //Right here, I am assigning the SQL syntax of delete to a variable
    const deleteBooksQuery = `DELETE FROM books WHERE id = $1 RETURNING *`
    
    //declaring the params Id position number to delete to a variable
    const deleteValues = [
        req.params.bookId,
    ]

    //I am sending a database query
    db.query(deleteBooksQuery, deleteValues)
    .then((databaseResult)=> {
        console.log(databaseResult)
        //I understand this to mean that if the row to be deleted is 0, then an error should be send with json
        if (databaseResult.rowCount===0) {
            res.status(404)
            res.json({error:"book does not exist"})
        } else {
            res.json({book:databaseResult.rows[0]})
        }
    })
    //this part of code is to catch an unintended error
    .catch ((error) => {
        console.log(error)
        res.status(500)
        res.json({error: 'unexpected error'})
    })

})

//I am stating the put method here
booksRouter.put('/:bookId', (req, res)=>{
    //I am declaring a variable and assigning the syntax/format for the put method to it
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

    //declaring the expected input to a variable
    const updateValues = [
        req.body.title, 
        req.body.type,
        req.body.author,
        req.body.topic,
        req.body.publicationDate,
        req.body.pages,
        req.params.bookId,
    ]

    //sending my request to the database through 'db'
    db.query(updateBooksQuery, updateValues)
    .then (databaseResult => {
        console.log(databaseResult)
        //I understood in class that if a row count is 0, it should definitely show error, because 0 doesn't exist
        if(databaseResult.rowCount===0) {
            res.status(404)
            res.json({error:'book does not exist'})
        }
        else {
            res.json({book: databaseResult.rows[0]})
        }
    })
    .catch(error=> {
        console.log(error)
        res.status(500)
        res.json({error: 'unexpected error'})
    })


})

module.exports=booksRouter