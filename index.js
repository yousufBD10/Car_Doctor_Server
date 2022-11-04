const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port= process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_password}@cluster0.fvyg8ej.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT (req,res,next){
   const authHeader = req.headers.authorizaton;
   if(!authHeader){
      return res.status(401).send({message: "unauthorized access"})
   }
     const token = authHeader.split(' ')[1];
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
      if(err){
      return   res.status(401).send({message: "unauthorized access"})
      }
      req.decoded = decoded;
      next();
     })
}


async function run(){
   try{ 
    // await client.connect()
         const serviceCollection = client.db('carDoctor').collection('services');
         const orderCollection = client.db('carDoctor').collection('orders');


      app.post('/jwt',(req,res)=>{
         const user = req.body;
       const token= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
       res.send({token});
      })


         app.get('/services', async (req,res)=>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray();
            res.send(service);

         });
         app.get('/services/:id', async (req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)};
            const serv = await serviceCollection.findOne(query);
           
            res.send(serv);

         });


         // delete ordrs

         app.delete('/orders/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result);
         })

         //orders
          
         app.get('/orders',verifyJWT, async(req,res)=>{
            const decoded = req.decoded;
            console.log("insied decoded",decoded);
            if(decoded.email !== req.query.email){
               res.status(401).send({message: "unauthorized access"})
            }
         
            let query = {};
            if(req.query.email){
                query={
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
         })

         app.post('/orders', async (req,res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
         })
   }

   catch{
    console.error(error);
   }


}

run().catch(err=>console.error(err))



app.get('/',(req,res)=>{
    res.send('Car Doctor server is running');
})

app.listen(port,()=>{
    console.log(`Car Doctor server is running on ${port}`);
})