import orderModel from "../models/orderModel.js"
import userModel from '../models/userModel.js'
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

//placing user order from frontend
const placeOrder = async (req,res) => {

     const frontend_url = "http://localhost:/5174";

     try {
        const newOrder = new orderModel({
            userId:req.body.userId,
            items:req.body.items,
            amount:req.body.amount,
            address:req.body.address
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}});

        const options = {
            amount: req.body.amount * 100, // amount in smallest currency unit
            currency: "INR",
            receipt: newOrder._id.toString()
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order, orderId: newOrder._id });

     } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
     }
}

const verifyOrder = async (req, res) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, success } = req.body;
    try {
        if (success === "true") {
            const body = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature === razorpaySignature) {
                await orderModel.findByIdAndUpdate(orderId, { payment: true });
                res.json({ success: true, message: "Paid" });
            } else {
                res.json({ success: false, message: "Invalid signature" });
            }
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Not Paid" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};
//user orders for frontend
const userOrders = async(req,res)=>{
    try {
        const orders = await orderModel.find({userId:req.body.userId});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//listing orders for admin panel
const listOrders = async(req,res) =>{
     try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
     } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
     }
}

//api for updating order status
const updateStatus = async(req,res)=>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
        res.json({success:true,message:"Status Updated"})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {placeOrder,verifyOrder, userOrders,listOrders,updateStatus 
}