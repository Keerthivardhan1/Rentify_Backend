require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors  = require('cors')
const ObjectId = require('mongodb').ObjectId;
const app = express();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>console.log("DB connected"))
.catch((er)=>console.log(er))

app.use(express.json());
app.use(cors())

// User Schema
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phoneNumber: String,
    password: String,
    role: String, // seller or buyer
});

const User = mongoose.model('User', userSchema);

// Property Schema
const propertySchema = new mongoose.Schema({
    uuid: { type: String, default: uuidv4, unique: true },
    title: String,
    description: String,
    location: String,
    bedrooms: Number,
    bathrooms: Number,
    rent: Number,
    email:{ type: String , ref:'User'},
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Property = mongoose.model('Property', propertySchema);

// Register Route
app.post('/register', async (req, res) => {
    const data = await req.body;
    // console.log("data = " , data);
    const { firstName, lastName, email, phoneNumber, password, role } = await req.body;
    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, email, phoneNumber, password, role });
    await user.save();
    res.json(user);
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = await req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    // const isMatch = await bcrypt.compare(password, user.password);
    if (password != user.password) {
        // console.log("password = " , password , "user.pass = " , user.password)
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    // const token = jwt.sign({ userId: user._id, role: user.role }, 'secretkey');
    // res.json({ token });
    res.json(user);
});

// Middleware to authenticate user     "seller": "6652d77135141b74f54a85e7"

// const auth = (req, res, next) => {
//     const token = req.header('Authorization').replace('Bearer ', '');
//     const decoded = jwt.verify(token, 'mysecretkey');
//     req.user = decoded;
//     next();
// };

// Seller Route to post property

app.post('/properties', async (req, res) => {

    

    const {email} = await req.body.form;
    const user  = await User.findOne({email})

    // console.log("body = " , req.body.form);
    // console.log("user = " ,  user);

    if (user.role !== 'seller') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const property = new Property({ ...req.body.form });
    await property.save();
    res.json(property);
});

// Buyer Route to get properties
app.get('/properties', async (req, res) => {
    const properties = await Property.find().populate('seller');
    res.json(properties);
});

app.post('/property/interest' ,async (req, res)=>{
    // const 
    const {email} = await req.body
    // console.log("email = " , email)
    const seller = await User.findOne({email});
    res.status(200).json({
        firstName:seller.firstName,
        email:seller.email,
        phoneNumber:seller.phoneNumber
    })
})

app.post('/getMyProperties' , async(req , res)=>{
    const {email} = await req.body;
    const properties = await Property.find({email})
    res.status(200).json(properties);
})

app.delete('/properties/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const property = await Property.findOneAndDelete({ uuid: propertyId });
  
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
  
      res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
