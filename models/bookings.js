module.exports = {
	identity: 'bookings',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		booking_id:{
			type: 'number',
			primaryKey:true,
			autoIncrement: true},	
		date: 'datetime',
		timeslot: 'string',
		online_status: 'string',
		
		rider_id:{
			columnName:'rider_id',
			model:'riders',
			type: 'integer'
		}
		
	}
};
