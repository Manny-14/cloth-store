import React from 'react'
import PropTypes from 'prop-types'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = ({ subtotal, shippingFee, total }) => {

 const {currency, delivery_fee, getCartTotal} = React.useContext(ShopContext)
 const resolvedSubtotal = typeof subtotal === "number" ? subtotal : getCartTotal()
 const resolvedShippingFee = typeof shippingFee === "number" ? shippingFee : delivery_fee
 const resolvedTotal = typeof total === "number"
  ? total
  : resolvedSubtotal === 0
    ? 0
    : resolvedSubtotal + resolvedShippingFee
  return (
    <div className='w-full'>
        <div className='text-xl'>
            <Title text1={"TOTAL"} text2={"PRICE"}/>
        </div>
        <div className='flex flex-col gap-2 mt-2 text-sm'>
            <div className='flex justify-between'>
                <p>Subtotal</p>
                <p>{currency}{resolvedSubtotal.toFixed(2)}</p>
            </div>
            <hr />
            <div className='flex justify-between'>
                <p>Shipping Fee</p>
                <p>{currency}{resolvedShippingFee.toFixed(2)}</p>
            </div>
            <hr />
            <div className='flex justify-between'>
                <b>Total</b>
                <b>{currency}{resolvedTotal.toFixed(2)}</b>
            </div>
        </div>
    </div>
  )
}

export default CartTotal

CartTotal.propTypes = {
    subtotal: PropTypes.number,
    shippingFee: PropTypes.number,
    total: PropTypes.number,
}