module.exports = {
	identity: 'orders',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		order_id:{
			type: 'number',
			primaryKey:true,
			autoIncrement: true},
			
		order_payment:'string',
		delivery_fee:'string',
		order_status:'string',
		restaurant_status:'string',
		rider_status:'string',
		order_placed_at:'datetime',
		order_assigned_at:'datetime',
		order_delivered_at:'datetime',
		order_lat:'string',
		order_lan:'string',
		reciever_no:'string',
		rider_tip:'string',
		delivery_time:'string',
		
		rider_id:{
			columnName:'rider_id',
			model:'riders',
			type: 'integer'
		},
		user_id:{
			columnName:'user_id',
			model:'users',
			type: 'integer'
		},
		
		fooditem_to_order_Fk:{
			collection:'fooditems',
			via:'order_to_fooditem_Fk',
			through: 'ordersitems'
		},
		restaurant_id:{
			columnName:'restaurant_id',
			model:'restaurants',
			type: 'integer'
		}
		
	}
};
