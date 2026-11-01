import mongoose from "mongoose";
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    email:{
         type:String,
        required: true,
        unique: true
    },
    password: {
         type:String,
        required: true,
        select: false
    },

})


userSchema.pre("save", async function () {
    if(!this.isModified('password')){
        return
    }

    this.password = await bcrypt.hash(this.password, 10)
})


export const User = mongoose.model("User", userSchema)


