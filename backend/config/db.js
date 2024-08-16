import mongoose from  "mongoose";

export const connectDB = async() =>{
    await mongoose.connect('mongodb+srv://vasudhameena:Sarpanch2612@cluster0.jgkkck0.mongodb.net/Project2').then(()=>console.log("DB connected"))
}
