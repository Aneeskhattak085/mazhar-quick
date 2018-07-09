module.exports = {
	identity: 'fooditems',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		item_id:{type: 'number',
					primaryKey:true,
					autoIncrement: true},
		item_name: 'string',
		item_type: 'string',
		item_price: 'string',
		item_detail:'string',
		cooking_time:'string',
		
		order_to_fooditem_Fk:{
			collection:'orders',
			via:'fooditem_to_order_Fk',
			through: 'ordersitems'
		},
		menu_id:{
			columnName:'menu_id',
			model:'menus',
			type: 'integer'
		}
	
	
	
		
	}
	
		
};
