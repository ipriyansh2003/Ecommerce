const mongoose = require('mongoose')

const ProductSchema = mongoose.Schema({
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
    image:{
        type:String
    }
})
//  npm install express-fileupload fs-extra mkdirp resize-img
let product =new mongoose.model('product',ProductSchema)
module.exports=product