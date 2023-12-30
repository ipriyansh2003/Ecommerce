const mongoose = require('mongoose')

const CartSchema = mongoose.Schema({
    title:{
        type:String
    },
    slug:{
        type:String
    },
    desc:{
        type:String
    },
    category:{
        type:String
    },
    price:{
        type:Number
    },
    quantity:{
        type:Number
    },
    image:{
        type:String
    },
    subtotal:{
        type:Number
    }
}) 
//  npm install express-fileupload fs-extra mkdirp resize-img
let cart =new mongoose.model('cart',CartSchema)
module.exports=cart