const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT | 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongo connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vxr0x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// main function
async function run() {
    try {
        await client.connect();

        const database = client.db('watchStore');
        const productsCollection = database.collection('products');
        const reviewsCollection = database.collection('reviews');
        const purchasedCollection = database.collection('purchasedProducts')


        // GET API (get exact 6 products for homepage)
        app.get('/products', async (req, res) => {
            const result = await productsCollection.find({}).limit(6).toArray();
            res.json(result);
        });

        // GET API (get all products)
        app.get('/allServices', async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.json(result);
        });

        // GET API (get single product to purchase)
        app.get('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);

        })

        // GET API (get all reviews)
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.json(result);
        });


        // POST API (set purhased products to database)
        app.post('/purchased', async (req, res) => {
            const purchased = req.body;

            const result = await purchasedCollection.insertOne(purchased);
            res.json(result);
        })





    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Watch store running!')
})

app.listen(port, () => {
    console.log(`Listening:${port}`)
})