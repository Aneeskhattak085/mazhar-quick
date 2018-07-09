module.exports = {
	identity: 'riders',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		rider_id: {type: 'number',
					primaryKey:true,
					autoIncrement: true},
		rider_name: 'string',
		rider_email: 'string',
		rider_username: 'string',
		rider_password: 'string',
		rider_mobile_no: 'string',
		rider_registration_no: 'string',
		rider_postal_code: 'string',
		rider_address: 'string',
		rider_lat: 'string',
		rider_lan: 'string',
		rider_cnic: 'string',
		rider_token: 'string',
		rider_status: 'string',
		firebase_token: 'string',
		
		order_to_rider_Fk:{
			collection:'orders',
			via:'rider_id'
		},
		feedback_id:{
			collection:'feedbacks',
			via:'rider_id'
		}
	}
};
