const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gkejsh2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
       const mobileCategories = client.db('mobilemarket').collection('mobileCategories');
       const phonesCollection = client.db('mobilemarket').collection('mobilesCollection');
       const bookingsCollection = client.db('mobilemarket').collection('bookings');

       app.get('/categories',async(req,res)=>{
        const query = {};
        const result = await mobileCategories.find(query).toArray();
        res.send(result);
       })
       app.get('/categories/:id',async(req,res)=>{
        const id = req.params.id;
        const filter = {_id : ObjectId(id)};
        const result  = await mobileCategories.findOne(filter);
        res.send(result);
       })
       app.get('/products',async(req,res)=>{
         const query = {};
         const result = await phonesCollection.find(query).toArray();
         res.send(result)
       })
       app.get('/products/:name',async(req,res)=>{
        const name= req.params.name;
        const filter = {categoryName :name};
        const result = await phonesCollection.find(filter).toArray();
        console.log(result)
        res.send(result)
       })
       app.get('/bookings',async(req,res)=>{
        const email = req.query.email;
        const query = {email : email}
        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
       })
       app.get('/bookings/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id : ObjectId(id)};
        const booking = await bookingsCollection.findOne(query);
        res.send(booking)
       })

       app.post('/bookings',async(req,res)=>{
         
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
       })
     }
    finally{

    }

}
run().catch(console.log())

app.get('/',async(req,res)=>{
    res.send('mobile market server is running')
})
app.listen(port,()=> console.log(`Mobile market running on port ${port}`))