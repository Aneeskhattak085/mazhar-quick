module.exports = {
	identity: 'feedbacks',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		rider_email:{type: 'string',
					primaryKey:true},
		rider_suggestion: 'string',
		
		rider_id:{
			
			columnName:'rider_id',
			model:'riders',
			type: 'integer'
		}
	}
};
