const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

require('dotenv').config()

const port = process.env.PORT || 5055;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('service'));
app.use(fileUpload());

app.get('/', (req, res) => {
    res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wklhy.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const serviceCollection = client.db("phoneService").collection("services");
    const reviewsCollection = client.db("phoneService").collection("reviews");
    const orderCollection = client.db("phoneService").collection("order");
    
    app.post("/addService", (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const price = req.body.price;
        const filePath = `${__dirname}/services/${file.name}`;
        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                res.status(500).send({msg: "failed to server img"})
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            }
            serviceCollection.insertOne({name, price, image})
            .then(result => {
                fs.remove(filePath, error => {
                    if (error) {
                        res.status(500).send({msg: "failed to server img"})
                    }
                    res.send(result.insertedCount > 0)
                })
                
            })
            // return res.send({name: file.name, path: `/${file.name}`})
        })
    })

    app.get('/service', (req, res) => {
        serviceCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.delete('/delete/:id', (req, res) => {
        console.log(req.params.id);
        serviceCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.send(result.deletedCount > 0);
            })
    })

    app.post('/product/:id', (req, res) => {
        console.log(req.params.id);
        serviceCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, items) => {
                res.send(items);
                console.log(items);
            })
    })

    app.post('/addReview', (req, res) => {
        const reviewInfo = req.body;
        console.log("add new review", reviewInfo);

        reviewsCollection.insertOne(reviewInfo)
            .then(result => {
                console.log('inserted count', result.insertedCount);
            })
    })

    app.get('/reviews', (req, res) => {
        reviewsCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.post('/addOrder', (req, res) => {
        const newOrder = req.body;
        console.log('samsul',newOrder);
        orderCollection.insertOne(newOrder)
        .then(result => {
            console.log(result);
        })
    })


    app.get('/orders', (req, res) => {
        orderCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })



});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})