import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const PlaceOrder = () => {
    const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext)

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: ""
    })

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }))
    }

 
   const placeOrder = async (event) =>{
       event.preventDefault();
       let orderItems = [];
       food_list.map((item)=>{
        if(cartItems[item._id]>0){
            let itemInfo = item;
            itemInfo["quantity"]=cartItems[item._id];
            orderItems.push(itemInfo);
        }
       })
      let orderData = {
        address:data,
        items:orderItems,
        amount:getTotalCartAmount()+2,
      }
      let response = await axios.post(url+"/api/order/place",orderData,{headers:{token}});
      if(response.data.success){
        const { order, orderId } = response.data;
        const options = {
            key: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay key ID
            amount: order.amount,
            currency: "INR",
            name: "Your Company",
            description: "Test Transaction",
            order_id: order.id,
            handler: async function (response) {
                const data = {
                    orderId: orderId,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                    success: true
                };
                let verificationResponse = await axios.post(url + "/api/order/verify", data);
                if (verificationResponse.data.success) {
                     clearCart();
                    window.location.replace(`${url}/verify?success=true&orderId=${orderId}`);
                } else {
                    window.location.replace(`${url}/verify?success=false&orderId=${orderId}`);
                }
            },
            prefill: {
                name: data.firstName + " " + data.lastName,
                email: data.email,
                contact: data.phone
            },
            theme: {
                color: "#3399cc"
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    } else {
        alert("Error");
    }
   }

   const navigate = useNavigate();

   useEffect(()=>{
      if(!token){
         navigate('/cart')
      }
      else if(getTotalCartAmount()===0){
        navigate('/cart')
      }
   },[token])

    return (
        <form onSubmit={placeOrder} className='place-order'>
            <div className="place-order-left">
                <p className="title">
                    Delivery Information
                </p>
                <div className="multi-fields">
                    <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' />
                    <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' />
                </div>
                <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address' />
                <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' />
                <div className="multi-fields">
                    <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' />
                    <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State' />
                </div>
                <div className="multi-fields">
                    <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code' />
                    <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' />
                </div>
                <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Contact number' />
            </div>
            <div className="place-order-right">
                <div className="cart-total">
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="cart-total-details">
                            <p>Subtotal</p>
                            <p>${getTotalCartAmount()}</p>
                        </div>
                        <hr />
                        <div className="cart-total-details">
                            <p>Delivery Fee</p>
                            <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
                        </div>
                        <hr />
                        <div className="cart-total-details">
                            <b>Total</b>
                            <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
                        </div>
                    </div>
                    <button type='submit'>PROCEED TO PAYMENT</button>
                </div>
            </div>

        </form>
    )
}

export default PlaceOrder
