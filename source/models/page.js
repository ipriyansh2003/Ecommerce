const mongoose = require('mongoose')

const PageSchema = mongoose.Schema({
    title:{
        type:String
    },
    slug:{
        type:String
    },
    content:{
        type:String
    },
    sorting:{
        type:Number
    }
})

let page =new mongoose.model('page',PageSchema)
module.exports=page