const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;

// STRIPE KEY
const stripe = require('stripe')(process.env.STRIPE_SECRET)

// middleware
app.use(cors());
app.use(express.json());

// mongo connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vxr0x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// main function
async function run() {
    try {
        await client.connect();

        const database = client.db('watchStore');

        // collections
        const productsCollection = database.collection('products');
        const reviewsCollection = database.collection('reviews');
        const purchasedCollection = database.collection('purchasedProducts');
        const usersCollection = database.collection('users');

        // ....................................................//

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

        });

        // GET API (get all reviews)
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.json(result);
        });


        // GET API (checking admin)
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }

            res.json({ admin: isAdmin });
        });

        // GET API (get users purchased products)
        app.get('/purchased', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const products = await purchasedCollection.find(query).toArray();
            res.json(products)
        });

        // GET API (get all purchased products for admin)
        app.get('/allPurchased', async (req, res) => {
            const result = await purchasedCollection.find({}).toArray();
            res.json(result)
        });

        // GET API (get all products to admin dashboard)
        app.get('/allProducts', async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.json(result);
        });

        // GET API (get specific product for pay)
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchasedCollection.findOne(query);
            res.json(result);

        });


        // ....................................................//

        // POST API (set purhased products to database)
        app.post('/purchased', async (req, res) => {
            const purchased = req.body;

            const result = await purchasedCollection.insertOne(purchased);
            res.json(result);
        });

        // POST API (set user to database)
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // POST API (post review to database)
        app.post('/postReview', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });

        // POST API (add product (admin only))
        app.post('/addProduct', async (req, res) => {
            const addProduct = req.body;
            const result = await productsCollection.insertOne(addProduct);
            res.json(result);
        });

        // stripe payment
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        });

        // ....................................................//

        // PUT API (make an admin)
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const update = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, update);
            res.json(result);
        });

        // PUT API (update status)
        app.put('/updateStatus/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateStatus = {
                $set: {
                    status: 'Approved'
                },
            };

            const result = await purchasedCollection.updateOne(filter, updateStatus, options);
            res.send(result);
        });

        // update payment status to the database
        app.put('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await purchasedCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // ....................................................//

        //  DELETE API (user deleting his/her purchase product before confirm)
        app.delete('/purchaseDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchasedCollection.deleteOne(query);
            res.json(result)

        });

        // DELETE API (admin deleting products)
        app.delete('/productDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result)

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