const express = require('express');
const app = express()
require('dotenv').config();
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9sv7xbd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        await client.connect(); // server update time this line delete

        // user
        const userData = client.db("library").collection("user");
        app.post('/user', async (req, res) => {
            const body = req.body;
            console.log(body);
            const result = await userData.insertOne(body);
            res.send(result);
        })

        // category
        const categoryData = client.db("library").collection("category");
        app.get('/category', async (req, res) => {
            const result = await categoryData.find().toArray();
            res.send(result);
        })

        // writer
        const writerData = client.db("library").collection("writer");
        app.get('/writer', async (req, res) => {
            const result = await writerData.find().toArray();
            res.send(result);
        })

        // Books collection
        const booksData = client.db("library").collection("books");
        app.get("/addBook", async (req, res) => {
            const result = await booksData.find().toArray();
            res.send(result);
        });

        app.get('/categorybooks/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category: category }
            const result = await booksData.find(query).toArray();
            res.send(result);
        });

        app.get("/details/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await booksData.findOne(query)
            res.send(result);
        });

        app.post('/books', async (req, res) => {
            const body = req.body;
            const result = await booksData.insertOne(body);
            res.send(result);
        })

        //  update quantity
        app.patch('/item-update/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id)};
            const update = {
                $set:{
                    quantity: body.qnt,
                }
            }
            const result = await booksData.updateOne(filter, update);

            res.send(result);
        })
//  update books
        app.patch('/update/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id)};
            const update = {
                $set:{
                    quantity: body.quantity,
                    name: body.name,
                    author: body.author,
                    photo: body.photo,
                    category: body.category,
                    rating: body.rating,
                }
            }
            const result = await booksData.updateOne(filter, update);

            res.send(result);
        })

        //  My cards (CURD operation)
        const borrowData = client.db("library").collection("borrow");
        app.get('/borrow', async (req, res) => {
            const email = req.query.email;
            const filter = { email : email }
            const result = await borrowData.find(filter).toArray();
            res.send(result);
        });

        app.post('/borrow', async (req, res) => {
            const body = req.body;
            const result = await borrowData.insertOne(body);
            res.send(result);
        });

        app.delete('/borrow/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: id};
            const result = await borrowData.deleteOne(query);
            res.send(result);
   
        });


        await client.db("admin").command({ ping: 1 }); // server update time this line delete
        console.log("Pinged your deployment. You successfully connected to MongoDB!"); // server update time this line delete
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})