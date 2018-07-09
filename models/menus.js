module.exports = {
	identity: 'menus',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		menu_id:{type: 'number',
					primaryKey:true,
					autoIncrement: true},
		menu_type: 'string',
		
		fooditem_to_menu_Fk:{
			collection:'fooditems',
			via:'menu_id'
		},
		restaurant_id:{
			columnName:'restaurant_id',
			model:'restaurants',
			type: 'integer'
		}
	}
};
