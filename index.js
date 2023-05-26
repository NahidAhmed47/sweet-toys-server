const express = require('express');
const app = express();
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ze0g6j8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10
});
async function run() {
  try {
    const teddyDataCollection = client.db("sweetToys").collection("teddyData");
    // teddyDataCollection.createIndex({ toy_name: "text" }, { name: "toy_name_1"}, { toy_name: 1 })
    // get all data
    app.get('/teddy-data', async (req, res) => {
      const result = await teddyDataCollection.find().toArray();
      res.send(result);
    })
    // pagination data collection
    app.get('/pagination', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const result = await teddyDataCollection.find().skip(skip).limit(limit).toArray();
      res.send(result);
    })
    // get specific toy by id
    app.get('/teddy-data/:id', async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await teddyDataCollection.findOne(query);
      res.send(result);
    })
    // find toys by email
    app.get('/my-toys/:email', async (req, res) => {
      const toys = await teddyDataCollection.find({ seller_email: req.params.email }).toArray();
      res.send(toys);
    })
    // find data by search
    app.get('/search', async (req, res) => {
      const searchText = req.query.text;
      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const result = await teddyDataCollection.find({ toy_name: { $regex: searchText, $options: 'i' } }).limit(limit).skip(skip).toArray();
      res.send(result);
    });
    // get total toys number
    app.get('/total-toys', async (req, res) => {
      const totalToys = await teddyDataCollection.estimatedDocumentCount();
      res.send({totalToys})
    });
    // create toys data
    app.post('/teddy-data', async (req, res) => {
      const newToy = req.body;
      const result = await teddyDataCollection.insertOne(newToy);
      res.send(result)
    })
    // get my toy data by descending
    app.get('/my-toys/descending-price/:email', async (req, res) => {
      const toys = await teddyDataCollection.find({ seller_email: req.params.email }).sort({ price: 1 }).toArray();
      res.send(toys)
    })
    // get my toy data by ascending price
    app.get('/my-toys/ascending-price/:email', async (req, res) => {
      const toys = await teddyDataCollection.find({ seller_email: req.params.email }).sort({ price: -1 }).toArray();
      res.send(toys)
    })
    // update toy data
    app.put('/updateToy/:id', async (req, res) => {
      const newToyData = req.body;
      const filter = { _id: new ObjectId(req.params.id) };
      const updatedToy = {
        $set: {
          price: newToyData.price,
          available_quantity: newToyData.available_quantity,
          description: newToyData.description
        }
      }
      const result = await teddyDataCollection.updateOne(filter, updatedToy);
      res.send(result)
    })
    // delete toy data 
    app.delete('/teddy-data/delete/:id', async (req, res,) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await teddyDataCollection.deleteOne(query);
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
})

app.listen(port, (req, res) => {
  console.log(`listening on ${port}`)
})