module.exports = {
	identity: 'timeslots',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		
		timeslot_id:{	 
			type: 'number',
			primaryKey:true,
			autoIncrement: true},	
		timeslot: 'string',
		
	}
};
