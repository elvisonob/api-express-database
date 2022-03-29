const express=require('express')
const res = require('express/lib/response')

const petsRouter=express.Router()

const db= require ('../utils/database')

petsRouter.get('/', (req,res)=>{
    //Adding the limit and offset of extension 1 to the 'selectAllPetsQuery' variable
    const selectAllPetsQuery='SELECT * FROM pets limit 10 offset 50'

    db.query(selectAllPetsQuery)
    .then(databaseResult=> {
        res.json({pets:databaseResult.rows})
    })

    .catch(error=>{
        res.status(500)
        res.json({error: 'unexpected Error'})
        console.log(error)
    })
})

petsRouter.get('/:id', (req, res)=>{

    const selectSinglePetQuery='SELECT * FROM pets WHERE id=$1'

    const queryValues=[
        req.params.id
    ]

    db.query(selectSinglePetQuery, queryValues)
    .then(databaseResult=> {
        //if the pet is not found, return a 404
        if(databaseResult.rowCount===0) {
            res.status(404)
            res.json({error:'Pet does not exist' })
        } else {
            //if pet is found, return it
            res.json({pet:databaseResult.rows[0]})
        }
    })
    .catch(error=> {
        res.status(500)
        res.json({error:'unexpected Error'})
        console.log(error)
    })
})

petsRouter.post('/', (req, res)=>{
    const insertPetsQuery=`
    INSERT INTO pets(
        name,
        age,
        type,
        breed,
        microchip)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *`


const petValues = [
    req.body.name,
    req.body.age,
    req.body.type,
    req.body.breed,
    req.body.microchip
]

db.query(insertPetsQuery, petValues)
.then(databaseResult=> {
    res.json({pets:databaseResult.rows[0]})
})

.catch(error=>{
    console.log(error)
    res.status(500)
    res.json({error:'unexpected error'})
})

})

//DELETE
//I am making a delete method here with a pet param.
petsRouter.delete("/:petId", (req, res) =>{
    //Right here, I am assigning the SQL syntax of delete to a variable
    const deletePetsQuery = `DELETE FROM pets WHERE id = $1 RETURNING *`
    //declaring the params Id position number to delete to a variable
    const deleteValues=[
        req.params.petId,
    ]

    //I am sending a database query
    db.query(deletePetsQuery, deleteValues)
    .then((petResult)=> {
        console.log(petResult)
        if(petResult.rowCount===0) {
            res.status(404)
            res.json({error: "pet does not exist"})
        } else {
            res.json({pet: petResult.rows[0]})
        }
    })
    //this part of code is to catch an unintended error
    .catch((error) => {
        console.log(error)
        res.status(500)
        res.json({error: 'unexpected error'})
    })
})

//UPDATING
//I am stating the put method here
petsRouter.put('/:petId', (req, res)=> {
    //I am declaring a variable and assigning the syntax/format for the put method to it
    const updatePetsQuery = `
    UPDATE pets SET
    name = $1,
    age = $2,
    type = $3,
    breed = $4,
    microchip = $5
WHERE id = $6
RETURNING *`

//declaring the expected input to a variable
const updateValues = [
    req.body.name,
    req.body.age,
    req.body.type,
    req.body.breed,
    req.body.microchip,
    req.params.petId,
]

//sending my request to the database through 'db'
db.query(updatePetsQuery, updateValues)
.then(databaseResult=> {
    console.log(databaseResult)
    if (databaseResult.rowCount===0) {
        res.status(404)
        res.json({error: 'pet does not exist'})
    }
    else {
        res.json({pet:databaseResult.rows[0]})
    }
})
.catch(error=> {
    console.log(error)
    res.status(500)
    res.json({error: 'unexpected error'})
})

})


module.exports=petsRouter