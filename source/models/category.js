const mongoose = require('mongoose')

const CategorySchema = mongoose.Schema({
    title:{
        type:String
    },
    slug:{
        type:String
    }
})

let category =new mongoose.model('category',CategorySchema)
module.exports=category