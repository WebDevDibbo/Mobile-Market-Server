const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gkejsh2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send("unauthorized access")
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
    if(err){
      return res.status(403).send({message:"forbidden access"});
    }
    req.decoded = decoded;
    next();
  })
}

async function run(){
    try{
       const mobileCategories = client.db('mobilemarket').collection('mobileCategories');
       const phonesCollection = client.db('mobilemarket').collection('mobilesCollection');
       const bookingsCollection = client.db('mobilemarket').collection('bookings');
       const paymentsCollection = client.db('mobilemarket').collection('payments');
       const usersCollection = client.db('mobilemarket').collection('users');

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
       app.get('/categoriesname',async(req,res)=>{
        const query = {};
        const result = await mobileCategories.find(query).project({name:1}).toArray();
        res.send(result)
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
       app.post('/products',async(req,res)=>{
        const product = req.body;
        const result = await phonesCollection.insertOne(product);
        res.send(result);
       })
       app.get('/jwt',async(req,res)=>{
        const email  = req.query.email;
        const query = {email : email}
        const user = await usersCollection.findOne(query);
      
        if(user && user.email){
         const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:'6h'})
         console.log(token);
         return res.send({accessToken:token})
        }
        console.log(user)
        res.status(403).send({accessToken : ""});
       })
       app.post('/users',async(req,res)=>{
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);

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

       app.post('/create-payment-intent',async(req,res)=>{
        const booking = req.body;
        const price = booking.price;
        const amount = price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          currency: "usd",
          amount: amount,
          payment_method_types: [
            "card"
          ],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        })
      })
        
      app.post('/payments',async(req,res)=>{
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);
        const id = payment.bookingId;
        const filter = {_id : ObjectId(id)};
        const updatedDoc = {
          $set:{
            paid: true,
            transactionId : payment.transactionId
          }
        }
        const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);
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