module.exports = {
	identity: 'users',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		user_id:{type: 'number',
					primaryKey:true,
					autoIncrement: true},
		user_name: 'string',
		user_fname: 'string',
		user_lname: 'string',
		user_address: 'string',
		user_mobile_no: 'string',
		user_username: 'string',
		user_password: 'string',
		user_postal_code: 'string',
		user_token: 'string',
		user_firebase_token: 'string',
		user_activation_code: 'string',
			user_email_status: 'string',

		order_to_user_Fk:{
			collection:'orders',
			via:'user_id'
		},
		locations_to_user_Fk:{
			collection:'locations',
			via:'user_id'
		}
	}
};
