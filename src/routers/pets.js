const express=require('express')
const res = require('express/lib/response')

const petsRouter=express.Router()

const db= require ('../utils/database')

petsRouter.get('/', (req,res)=>{
    const selectAllPetsQuery='SELECT * FROM pets'

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


module.exports=petsRouter