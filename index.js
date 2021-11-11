const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const port = process.env.PORT | 5000;

app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vxr0x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();

        const database = client.db('watchStore');
        const productsCollection = database.collection('products');
        const reviewsCollection = database.collection('reviews');


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

        // GET API (get all reviews)
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.json(result);
        });





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