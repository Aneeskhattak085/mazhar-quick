module.exports = {
	identity: 'ordersitems',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		fooditem:{
			model:'fooditems'
		},
		order:{
			model:'orders'
		}
		
	}
};
