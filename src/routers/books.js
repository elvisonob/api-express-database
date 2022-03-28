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

module.exports=booksRouter