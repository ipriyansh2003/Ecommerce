let express = require('express')
let app = express()
let path = require('path')
const hbs = require('hbs')
const multer = require('multer')
const fs = require('fs')
const port = 5000
require('./db/database.js')
require('dotenv').config()
const auth =require('../middleware/auth.js')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cookieParser=require('cookie-parser')

const Pagemanager=require('./models/page.js')
const Categorymanager = require('./models/category.js')
const Productmanager = require('./models/product.js')
const Cartmanager = require('./models/cart.js')
const registerManager = require('./models/register.js')
const reportManager = require('./models/reports.js')

const dirname=path.resolve(__dirname)
const templatepath = path.join(dirname,"../templates/views")
const partialpath=path.join(dirname,"../templates/partials")

const storage = multer.diskStorage({
    destination:function (req,file,cb){
       return cb(null,'./uploads')
    },
    filename:function (req,file,cb){
        return cb(null,`${Date.now()}-${file.originalname}`)
     },
})
const upload = multer({storage:storage})

app.set('view engine','hbs')
app.set('views',templatepath)
hbs.registerPartials(partialpath)

app.use(express.static('./uploads'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.get('/',auth,(req,res)=>{
    if(req.user.isAdmin){
        res.redirect('/admin')
    }
    else{
        res.render('index.hbs',{
            email:req.user.email
        })
    }
})

app.get('/admin',auth,(req,res)=>{
      res.redirect('/pages')
})


app.get('/register',async(req,res)=>{
    
    const token=req.cookies.jwt
    if(token){
        res.send("you are already loggined")
    }
    else{
        res.clearCookie('jwt')
        res.render('register.hbs')
    }
})

app.post('/register',async(req,res)=>{
try {
    const password = req.body.password
    const cpassword = req.body.confirmpassword

    if(password===cpassword){
       
        const register = new registerManager({
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            age:req.body.age,
            phone:req.body.phone,
            gender:req.body.gender,
            password:password,
            confirmpassword:cpassword,
            isAdmin:0
        })
      

        const registered = await register.save()
        res.redirect('/login')
    }
    else{
        res.send("password not matched")
    }

} catch (error) {
    console.log(error)
    res.send(error)
}
})

app.get('/registerapi',async(req,res)=>{
    const data = await registerManager.find()
    res.json(data)
})

app.get('/login',async(req,res)=>{
    
    const token=req.cookies.jwt
    if(token){
        res.send("you are already loggined")
    }
    else{
        res.clearCookie('jwt')
        res.render('login.hbs')
    }
})


app.post('/login',async(req,res)=>{
    try {
        const email = req.body.email
        const password = req.body.password
        const useremail= await registerManager.findOne({email:email})
        const isMatch = await bcrypt.compare(password,useremail.password)

        const token=await useremail.generateAuthToken()
        res.cookie('jwt',token)

        if(isMatch){
           if(useremail.isAdmin){
                res.redirect('/admin')
           }
           else{
                
                res.redirect('/')
           }
        }
        else{
            res.clearCookie('jwt')
            res.send("invalid email or password")
        } 

    } catch (error) {
        res.send(error)
    }
})
app.get('/logout',(req,res)=>{
    try {
        res.clearCookie('jwt')
        res.redirect('/login')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})
app.get("/reports",auth,(req,res)=>{
    if(req.user.isAdmin){
        res.render('adminreport.hbs',{
            email:req.user.email
        })
    }
    else{
        res.render('reports.hbs',{
            email:req.user.email
        })
    }
    
})

app.post('/addproduct',upload.single('profileimage'),async(req,res)=>{
    
    const token = req.cookies.jwt
    const verifyuser = jwt.verify(token,process.env.SECRET_KEY)
     
    const user = await registerManager.findOne({_id:verifyuser._id})
    const registerproduct = new Productmanager({
        title:req.body.title,
        price:req.body.price,
        desc:req.body.desc,
        category:req.body.category,
        image:req.file.filename
    })
    const registered = await registerproduct.save()
    res.redirect('/products')
})

app.get('/addpage',(req,res)=>{
    const title=""
    const slug = ""
    const content = ""
    res.render('admin/addpage.hbs',{
           pagetitle:'admin header',
           title:title,
           slug:slug,
           content:content
    })
})

app.post('/addpage',async(req,res)=>
{
    const registerPage = new Pagemanager({
        title:req.body.title,
        slug:req.body.slug,
        content:req.body.content
    })
    const registered = await registerPage.save()
    res.redirect('/pages')
   
})



app.get('/pages',(req,res)=>{
    res.render('admin/pages.hbs',{
        pagetitle:'Admin area',
        pages:Pagemanager
    })
})

app.get('/pageapi',async(req,res)=>{
    const data = await Pagemanager.find()
    res.json(data)
})

app.post('/pages/delete-page/:id',async(req,res)=>{
    try{
        const id=req.params.id
        const page = await Pagemanager.deleteOne({_id:`${id}`})
        res.redirect('/pages')
    }
    catch(err){
        res.redirect("/")
    }
})

app.get('/pages/edit-page',(req,res)=>{
    res.render('admin/edit-page.hbs') 
})

app.post('/pages/edit-page/:id',async(req,res)=>{
    const id1=req.params.id
    const edittitle = req.body.title
    const editslug = req.body.slug
    const editcontent = req.body.content

    const update = await Pagemanager.updateMany({_id:`${id1}`},{$set:{title:`${edittitle}`,slug:`${editslug}`,content:`${editcontent}` }})

    console.log(update)
    res.redirect('/pages')
})

app.get('/categories',(req,res)=>{
    res.render('admin/categories.hbs',{
        pagetitle:'Admin area'
    })
})
app.get('/addcategories',(req,res)=>{
    res.render('admin/addcategories.hbs')
})

app.post('/addcategory',async(req,res)=>{
    const registerCategory = new Categorymanager({
        title:req.body.title,
        slug:req.body.slug
    })
    const registered = await registerCategory.save()
    res.redirect('/categories')
})
app.get('/categoryapi',async(req,res)=>{
    const data = await Categorymanager.find()
    res.json(data)
})

app.post('/categories/delete-category/:id',async(req,res)=>{
    try{
        const id=req.params.id
        const page = await Categorymanager.deleteOne({_id:`${id}`})
        res.redirect('/categories')
    }
    catch(err){
        res.redirect("/")
    }
})

app.get('/categories/edit-category',(req,res)=>{
    res.render('admin/edit-category.hbs') 
})

app.post('/categories/edit-category/:id',async(req,res)=>{
    const id1=req.params.id
    const edittitle = req.body.title

    const update = await Categorymanager.updateMany({_id:`${id1}`},{$set:{title:`${edittitle}`}})

    console.log(update)
    res.redirect('/categories')
})

app.get('/products',(req,res)=>{
    res.render('admin/product.hbs',{
        pagetitle:'Admin area'
    })
})

app.get('/addproduct',(req,res)=>{
    const title = ""
    const price= ""
    const desc = ""
    res.render('admin/addproduct.hbs',{
        pagetitle:'Admin area',
        title:title,
        price:price,
        description:desc,
    })
})
app.get('/productapi',async(req,res)=>{
    const data = await Productmanager.find()
    res.json(data)
})


app.post('/products/delete-product/:id',async(req,res)=>{
    try{
        const id=req.params.id
        const user = await Productmanager.find({_id:id})
        const product = await Productmanager.deleteOne({_id:`${id}`})
        
        
         const filename = user[0].image
         const deletecart = await Cartmanager.deleteOne({image:filename})
         const filepath = path.join(dirname,`../uploads/${filename}`)
         fs.unlink(`${filepath}`, (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log('File deleted successfully');
          }
          )
        res.redirect('/products')

    }
    catch(err){
        console.log(err)
        res.redirect("/")
    }
})

app.get('/products/edit-product',(req,res)=>{
    res.render('admin/edit-product.hbs') 
})

app.post('/products/edit-product/:id',upload.single('profileimage'),async(req,res)=>{
    const id1=req.params.id
    const edittitle = req.body.title
    const editprice = req.body.price
    const editcategory = req.body.category
    const editdesc = req.body.desc
    const editimage = req.body.filename
    const update = await Productmanager.updateMany({_id:`${id1}`},{$set:{title:`${edittitle}`,price:`${editprice}`,desc:`${editdesc}`,category:`${editcategory}`,image:`${editimage}`}})
    const del = await Cartmanager.deleteMany({})

    console.log(update)
    res.redirect('/products')
})


app.get('/productcategoryapi',async(req,res)=>{
     const categoryproduct = await Productmanager.find().select({category:1,_id:0})
     res.json(categoryproduct)
})

app.get('/product/:category',async(req,res)=>{
    const category = req.params.category
            res.render('categoryproduct.hbs',{
            category:`${category}`
        }) 
})

app.get('/categorywiseapi/:category',async(req,res)=>{
    const category = req.params.category

    const product = await Productmanager.find({category:`${category}`})
    res.json(product)
})

app.post('/cart/:id',async(req,res)=>{
    
    const category = req.params.category
  
 
    const id = req.params.id
    const product = await Productmanager.find({_id: req.params.id})
    
    const cart = await Cartmanager.find({title:product[0].title})

   

   console.log(cart.length)
   
    const length = cart.length
   if(length > 0){
       res.redirect('/')
   }
   else{
    const registerCart = new Cartmanager({
        title:product[0].title,
        desc:product[0].desc,
        category:product[0].category,
        price:product[0].price,
        image:product[0].image,
        quantity:1,
        subtotal:product[0].price
    })
    const registered = await registerCart.save()
    res.redirect('/')
   }
   
})

app.get('/cart/api',async(req,res)=>{
     const cart = await Cartmanager.find()
     res.json(cart)
})


app.get('/cart',async(req,res)=>{   
        res.render('cart.hbs')
})

app.post("/cart/add/:id",async(req,res)=>{
    const id = req.params.id
    const product = await Cartmanager.find({_id: req.params.id})
     
        count = product[0].quantity + 1;
        const subtotals = count*product[0].price;
    const newcount = await Cartmanager.updateMany({_id: req.params.id},{$set:{quantity:count,subtotal:subtotals}})    

        res.render('cart.hbs')


})

app.get('/cart/sub/:id',(req,res)=>{
    res.redirect('/cart')
})
app.get('/cart/add/:id',(req,res)=>{
    res.redirect('/cart')
})

app.post("/cart/sub/:id",async(req,res)=>{
    const id = req.params.id
    const product = await Cartmanager.find({_id: req.params.id})
 
    if(product[0].quantity <= 1)
    {
    const deletecart = await Cartmanager.deleteOne({_id: req.params.id}) 
        res.render('cart.hbs')
    }
     else
     {
        count = product[0].quantity - 1;
        const subtotals = count*product[0].price;
        const newcount = await Cartmanager.updateMany({_id: req.params.id},{$set:{quantity:count,subtotal:subtotals}})    

        res.render('cart.hbs')
     }
})

app.post('/cart/delete/:id',async(req,res)=>{
    const deletecart = await Cartmanager.deleteOne({_id: req.params.id})
    
        res.render('index.hbs',{
            pagetitle:'Home',
            heading:'hello'
        })
})


app.post('/deletecarts',async(req,res)=>{
   
   
    try{
       const del = await Cartmanager.deleteMany({})
      console.log(del)

    }
    catch(err){
        console.log(err) 
    }
    res.redirect('/cart')

})


app.get('/home',(req,res)=>{
    res.redirect('/')
})


app.listen(port,()=>{
    console.log("server running")
})