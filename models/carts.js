module.exports = {
	identity: 'carts',
	
	connection: 'mysqlDB',
	schema:true,
	migrate: 'safe',
	
	attributes: {
		device_id:'string',
		item_id:'string',
		item_name: 'string',
		item_quantity: 'string',
		item_type: 'string',
		item_price: 'string',
		item_detail:'string',
		item_time: 'datetime',
		cooking_time:'datetime',
		menu_id:'string'
	}
};
