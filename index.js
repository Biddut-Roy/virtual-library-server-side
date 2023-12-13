const express = require('express');
require('dotenv').config();
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://virtualverse-library.web.app',
        'https://virtualverse-library.firebaseapp.com',
        'http://localhost:5174'
    ],
    credentials: true,
}));
app.use(express.json())
app.use(cookieParser())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9sv7xbd.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dbConnect = async () => {
    try {
        client.connect()
        console.log('DB Connected Successfully✅')
    } catch (error) {
        console.log(error.name, error.message)
    }
}
dbConnect()

const writerData = client.db("library").collection("writer");
const borrowData = client.db("library").collection("borrow");
const booksData = client.db("library").collection("books");
const categoryData = client.db("library").collection("category");
const userData = client.db("library").collection("user");
const booksDonateData = client.db("library").collection("donate");



// create  middleware
const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({ message: 'not authorized' });
    }
    jwt.verify(token, process.env.APP_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized' });
        }
        req.user = decoded;
        next();
    })
};



app.get('/', (req, res) => {
    res.send('check')

})

//  auth token create
app.post("/jwt", async (req, res) => {
    const body = req.body;
    const token = jwt.sign(body, process.env.APP_TOKEN_SECRET, { expiresIn: '1h' });
    res
        .cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'

            // httpOnly: true,
            // secure: process.env.NODE_ENV === "production" ? true : false,
            // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",               {token not working solver}
        })
        .send({ success: true })
})
// token clear
app.post('/logout', async (req, res) => {
    const body = req.body;
    res.clearCookie('token', {
        maxAge: 0,
        httpOnly: false,
        secure: true,
        sameSite: 'none'
    }).send({ clear: true });
})


// user
app.post('/user', async (req, res) => {
    const body = req.body;
    const result = await userData.insertOne(body);
    res.send(result);
})

app.put('/users', async (req, res) => {
    const body = req.body;
    const result = await userData.insertOne(body);
    res.send(result);
})

//  Check Admin 
app.get('/api/users/admin/:email',verifyToken,async (req, res) => {
    const email = req.params?.email;
    const query = { email: email }
    const user = await userData.findOne(query)
    let isAdmin = false;
        if (user?.roll === 'admin') {
            isAdmin = true
        }
 
    res.send({ isAdmin , user })
})



// category
app.get('/category', async (req, res) => {
    const result = await categoryData.find().toArray();
    res.send(result);
})

// writer
app.get('/writer', async (req, res) => {
    const result = await writerData.find().toArray();
    res.send(result);
})

// Books collection

app.get("/allBook",verifyToken, async (req, res) => {
    const result = await booksData.find({}).toArray();
    // const filter = result.filter(x=>x.quantity > 0)    // {quantity :{$ge : 0}} not working  
    res.send(result);

});

app.get("/sortBook", verifyToken, async (req, res) => {
    const result = await booksData.find({}).toArray();
    const filter = result.filter(x => x.quantity > 0)    // {quantity :{$ge : 0}} not working  
    res.send(filter);

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

app.post('/books', verifyToken, async (req, res) => {
    const body = req.body;
    const result = await booksData.insertOne(body);
    res.send(result);
})

//  update quantity
app.patch('/item-update/:id', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    const filter = { _id: new ObjectId(id) };
    const update = {
        $set: {
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
    const filter = { _id: new ObjectId(id) };
    const update = {
        $set: {
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
app.get('/borrows', verifyToken, async (req, res) => {
    const email = req.query.email;
    if (req.query?.email !== req.user.email) {
        return res.status(401).send({ message: 'access unauthorized' });
    }
    const filter = { email: email }
    const result = await borrowData.find(filter).toArray();
    res.send(result);
    console.log(email);
});

app.post('/borrow', async (req, res) => {
    const body = req.body;
    const result = await borrowData.insertOne(body);
    res.send(result);
});

app.delete('/borrow/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await borrowData.deleteOne(query);
    res.send(result);

});

//  Donation book collect

app.get('/donate', async (req, res) => {
    const result = await booksDonateData.find().toArray();
    res.send(result);
})

app.post('/donate', verifyToken, async (req, res) => {
    const body = req.body;
    const result = await booksDonateData.insertOne(body);
    res.send(result);
})

app.delete('/DonateDelete/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await booksDonateData.deleteOne(query);
    res.send(result);
})









app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})