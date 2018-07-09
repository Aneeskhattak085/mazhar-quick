module.exports = {
	identity: 'locations',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		user_nickname: 'string',
		user_flat_no: 'string',
		user_address: 'string',
		user_postal_code: {type: 'string',
					primaryKey:true},
		user_phone_no: 'string',
		rider_instructions: 'string',
	
	user_id:{
			columnName:'user_id',
			model:'users',
			type: 'integer'
		}
	}
};
