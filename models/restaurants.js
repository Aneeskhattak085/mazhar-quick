module.exports = {
	identity: 'restaurants',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		restaurant_id: {type: 'number',
					primaryKey:true,
					autoIncrement: true},
		restaurant_name: 'string',
			restaurant_description: 'string',
		restaurant_address:'string',
		restaurant_contect:'string',
		restaurant_image_url:'string',
		restaurant_delievery_time:'string',
		restaurant_postal_code:'string',
		restaurant_phone_no:'string',
		restaurant_email:'string',
		restaurant_password:'string',
		restaurant_username:'string',
		restaurant_opening_time:'string',
		restaurant_closing_time:'string',
		restaurant_status:'string',
		restaurant_token: 'string',
		firebase_token: 'string',
		menu_id:{
			collection:'menus',
			via:'restaurant_id'
		},
		order_to_retaurant_Fk:{
			collection:'orders',
			via:'restaurant_id'
		}
		
	}
	
};
