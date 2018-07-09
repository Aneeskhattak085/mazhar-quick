var express=require("express");
var routerUser=express.Router();
var randomize = require('randomatic');
var bodyParser = require('body-parser');
routerUser.use(bodyParser.urlencoded({ extended: false }));
routerUser.use(bodyParser.json());

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config/config.js');

var distance = require('google-distance');

var NodeGeocoder = require('node-geocoder');

//Distance After
var distancel = require('google-distance-matrix');
distancel.key('AIzaSyAfv4k8qljVt_Z4ltpSN8WEwe9JUOklb2A');
var options = {
  provider: 'google',
 
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: "AIzaSyDyamBO1Heo8nwXfy5vwk6QrnTt--mSCVM", // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
var geocoder = NodeGeocoder(options);

//mail
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  //port: 587,
  //secure: false, 
  auth: {
    user: '13151556-026@uog.edu.pk',
    pass: 'Pak098765'
  }
});

var stripe = require("stripe")(
  "sk_test_1zhRFQLMa2x4pjWwRLgbDoAu"
);

///paypal
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AbQerTsjBozLcoaaO3MMtNckrwWO-zfvdKoTd--8ucrXBq6TZ-HYmIE-xz78wYnopMh8i5tR2L0VjdLo',
  'client_secret': 'EEcrPkZ_t_962nTmVj1l5-RwGT4S_KfHitudZ3f_9WbLv4iyLQpzW6C9snU0mEwlbfxj-7Fb333o2THW'
});


routerUser.route("/pay")
.post(function(req, res){
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Red Sox Hat",
                "sku": "001",
                "price": "25.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "Hat for the best team ever"
    }]

}

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
			console.log(payment.links[i].href);
          res.redirect(payment.links[i].href);
        }
      }
  }
});

});

routerUser.route("/success")
.get(function(req, res){
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;


  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "25.00"
        }
    }]
  }

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.send('Success');
    }
});
});



routerUser.route("/cancel")
.get(function(req, res){
	res.send('Cancelled');
});

//paypal//

//FCM
var FCM = require('fcm-push'); 
var serverKey = 'AAAAOtTLxqk:APA91bE5EmxnuxfyzQNt3LMjJCL2--wBIZ3vH75y1jBA9RJ2QNAv4G6GppCXCcAmZO6Q-zEe5jYPWXrGtQYPRlnJo8FXEjacs66fOrGG4APlEWu2w0igxy7-x_gISCrRZjN59DTTCdou';
var fcm = new FCM(serverKey);


///////////////////////////////stripe payment integration
routerUser.route("/stripe")
.post(function(req,res){
		
		console.log("-------------------------------------------------------");

		console.log(JSON.stringify(req.body.data));

		console.log("-------------------------------------------------------");
		if(typeof req.body.data=='undefined')

		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.total_amount=='undefined' || typeof req.body.data.card_number=='undefined' || typeof req.body.data.cvv_number=='undefined'   || typeof req.body.data.e_month=='undefined'  || typeof req.body.data.e_year=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		

	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
			stripe.tokens.create({
  card: {
    "number":req.body.data.card_number,
    "exp_month":req.body.data.e_month ,
    "exp_year": req.body.data.e_year,
    "cvc": req.body.data.cvv_number
  }
}, function(err, token) {

	if(err){
		res.status(400).json({ err });

	console.log("-------token----error----------");
	console.log(err);
	console.log("-------token----error----------");
	}else{
				var amount=req.body.data.total_amount*100;
				stripe.charges.create({
				  amount: amount,
				  currency: "gbp",
				  source:token.id // obtained with Stripe.js
				 // description: "iftakhar167@gmail.com",

				}, function(error, charge) {
				

	if(err){

				res.status(401).json({ error });
	console.log("--------charge---error----------");
	console.log(err);
	console.log("--------charge---error----------");
	}else{
		res.status(200).json({ message:"success" });
	console.log("----------charge-success----------");
	console.log(charge);
	console.log("----------charge-success----------");

	}

				});



	}
	
  // asynchronously called
});


		//res.status(200).json({message:"success"});


		
	});

////////////////////////////////////////////////////

routerUser.route("/userList")
	.get(function (req,res){
		/* var token = req.headers['x-access-token'];
		 var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTQ1NDQ5OTgsImV4cCI6MTUxNDYzMTM5OH0.u0of-_m5h3rLSXAXWW0DQhQwNl4pklRNp6qIfeNTWMI";
		 if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		 jwt.verify(token, config.secret, function(err, decoded) {
				if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
			});
		*/
		db("users").find().exec(function(err,users){
			res.json(users);
		});
	});
	
	//////////////////////////user functions///////////////////////////////////////////////////////////////////
	function notify_restaurant_on_new_order(restaurant_id,order_id){

		var serverKey = 'AIzaSyCPjwLixMZ68y4B5MhnPnIp88TY2VXKMfY';
		var UserFcm = new FCM(serverKey);
			db("restaurants").findOne({"restaurant_id":restaurant_id})
			
				.exec(function (err,restaurant){
					if (!restaurant) return res.status(404).json({message:"There was a problem finding the restaurant."});
			console.log("restaurant.firebase_token---------------"+restaurant.firebase_token);
			var message = {
				to:restaurant.firebase_token, // required fill with device token or topics
				//to: 'eOS6Mgns5l4:APA91bHXYvGeStMLLSKSdvYPwC8tp1EdaRrdSYh5gxVZGbBJP4KddYsNIebBrVVBdv7aZBWYyqEuMC4vqcOs2zmfuON0nrEt5tr58gGABytnBNKH_Lx69Pzb9JcLGERcVEYgjRWdrV3A', // required fill with device token or topics
				collapse_key: 'your_collapse_key', 
				data: {
					order_id:order_id
					//order_id: req.params.order_id
				},
				notification: {
					title: 'Notification',
					body: 'New order Received.'
				}
			};

			UserFcm.send(message, function(err, response){
			if (err) {
				console.log("------------------notify_restaurant_on_new_order-----------------------");
			console.log("------------------errror-----------------------"+order_id);
			console.log("-------------------notify_restaurant_on_new_order----------------------");
				
					console.log("Something has gone wrong!"+err);
				} else {

						console.log("------------------notify_restaurant_on_new_order-----------------------");
			console.log("------------------succes-----------------------");
			console.log("-------------------notify_restaurant_on_new_order----------------------"+order_id);
					console.log("Successfully sent with response: ", response);
				}
			});
			

				
		});
			

	}
	
	/////////////////////////////////////////////////////////////////////////////////


	

//USER API'S
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	
	//LOGIN
	routerUser.route("/user/login")
	.post(function(req,res){
		
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.user_name=='undefined' || typeof req.body.data.user_password=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		var username=req.body.data.user_name;
		var pswd=req.body.data.user_password;
		
		var token ;
		
				db("users").findOne({"user_username":username,"user_password":pswd})
				.populate("locations_to_user_Fk")
				.populate("order_to_user_Fk")
				.exec(function (err,user){
					if (!user) return res.status(404).json({message:"There was a problem finding the user."});
					// create a token			
					token = jwt.sign({ id:pswd}, config.secret, {
						expiresIn: 86400 // expires in 24 hours	
					});
					user.user_token=token;
						var mailOptions = {
											from: '13151556-026@uog.edu.pk',
											to: user.user_username,
											subject: "Alert !",
											text: "You have logged in."
										};

									transporter.sendMail(mailOptions, function(error, info){
										if (error) {
											console.log(error);
										} else {
											console.log('Email sent: ' + info.response);
											return res.send('Email sent: ' + info.response);
										}
									});
					for(var i=0;i<user.locations_to_user_Fk.length;i++){
						user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
					}
					for(var i=0;i<user.order_to_user_Fk.length;i++){
						user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
					}
					user.save();					
					res.status(200).json({ auth: true, token: token, user });
				
				});
	});
	//////////Generate code and send mail to user befor signup

	routerUser.route("/get/verification/code")
	
	.post(function(req,res){
		
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.user_username=='undefined' )
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		var username=req.body.data.user_username;
		console.log(username);
		var code =randomize('A', 8);
		console.log(code);
		if(!code){
			return res.status(400).json({message:"A problem occure while generating code please try again."});
		}
		var mailOptions = {
		  from: '13151556-026@uog.edu.pk',
		  to: username,
		  subject:"Sign Up Verification Code",
		  text:"Your verification code is :"+code
		};

		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
			console.log(error);
		  } else {
			console.log('Email sent: ' + info.response);
			return res.send(code);
		  }
		});
		
		res.status(200).json({ Code:code });
		
	});
	
	//FORGET PASSWORD USER
	routerUser.route("/user/forget/password")
	.put(function(req,res){
		
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
			
		if(typeof req.body.data.user_name=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
			
		var user_email=req.body.data.user_name;
				
		db("users").findOne({"user_username":user_email})
		.populate("locations_to_user_Fk")
		.populate("order_to_user_Fk")
		.exec(function (err,user)
		{
			if(user){
				var code =randomize('0,A', 8);
				user.user_password=code;	
				
				var mailOptions = {
					from: '13151556-026@uog.edu.pk',
					to: user_email,
					subject: "subject",
					text: "Your New Password is : "+" "+code+" "+" kindly change it at your first login!"
				};

				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
						console.log(error);
					} 
					else {
						console.log('Email sent: ' + info.response);
						return res.send('Email sent: ' + info.response);
					}
				});
				for(var i=0;i<user.locations_to_user_Fk.length;i++){
					user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
				}
				for(var i=0;i<user.order_to_user_Fk.length;i++){
					user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
				}
				user.save();													
								
				return res.status(200).send({message: 'Password Changed!'});
								
			}
			else{
				return res.status(404).send({message: 'No Record With This Email Exist!'});
			}
		});	
	});
	
	//CHANGE PASSWORD USER
	routerUser.route("/change/user/password")
	.put(function(req,res){	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.curr_password=='undefined' || typeof req.body.data.new_password=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var curr_password=req.body.data.curr_password;
		var new_password=req.body.data.new_password;
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDUxOTIyNywiZXhwIjoxNTIwNjA1NjI3fQ.j5TKv7DGvPZkGFKfdEjicKJmeihKypQrc-3wvgSCF5c";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
			db("users").find().exec(function(err,users){
				if(users)
				{
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							db("users").findOne({"user_username":users[i].user_username,"user_password":curr_password})
							.populate("locations_to_user_Fk")
							.populate("order_to_user_Fk")
							.exec(function (err,user)
							{
								if(user)
								{
									user.user_password=new_password;	
										
										var mailOptions = {
											from: '13151556-026@uog.edu.pk',
											to: user.user_username,
											subject: "subject",
											text: "Your Password Has Been Changed."
										};

									transporter.sendMail(mailOptions, function(error, info){
										if (error) {
											console.log(error);
										} else {
											console.log('Email sent: ' + info.response);
											return res.send('Email sent: ' + info.response);
										}
									});
									for(var i=0;i<user.locations_to_user_Fk.length;i++){
										user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
									}
									for(var i=0;i<user.order_to_user_Fk.length;i++){
										user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
									}
									user.save();													
												
									return res.status(200).send({message: 'Password Changed!'});
												
								}
								else{
									return res.status(404).send({message: 'No Record Found!'});
								}
							});	
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				}
				else
					return res.status(404).send({message: 'No Record With This Email Exist!'});
			});	
		});				
				
	});


	//GET ALL REGISTERED USERS
	routerUser.route("/all/users")
	.get(function(req,res){
		
		db("users").find().exec(function(err,users){
			if(!err)
			{
				return res.status(200).json({ message:"Users List.", users });	
			}
			if(err)
			{
				return res.status(404).json({ message:"Unable To Get Any Response.", err });	
			}
		});
	});



	                                     
	
	//REGISTER USER
	routerUser.route("/user/register")
	.post(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		db("users").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"User has been created.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"User cant be created.", err });	
			}
		
		});
	});
	
	//POST TO CART (user)
	routerUser.route("/device/cart")
	.post(function(req,res){
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		db("carts").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"Value Added To Cart.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable To Add Value To Cart.", err });	
			}
		
		});
	});
	//update TO CART (user)
	routerUser.route("/update/device/cart")
	.put(function(req,res){
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}

		
		
		db("carts").findOne({"device_id":req.body.data.device_id,"item_id":req.body.data.item_id})
		
		.exec(function (err,cart){			
			if(cart){
				cart.item_quantity=req.body.data.item_quantity;					
				
				cart.save();												
								
				return res.status(200).send({message: 'cart Updated!'});
								
			}
			else{
				return res.status(404).send({message: 'No Record  Exist!'});
			}
		});
	});
	//GET FROM CART (user)
	routerUser.route("/get/cart/:id")
	.get(function (req,res){
		console.log(req.params.id);
		db("carts").find().exec(function(err,carts){
			var cart=[];
			for(var i=0;i<carts.length;i++)
			{
				if(req.params.id==carts[i].device_id)
				{
					cart.push(carts[i]);
				}
			}
			if(cart.length>0)
				res.status(200).json({cart});	
			else
				res.status(404).json({message:"No Item is Present In The Cart."});	
		});
	});
	
	//REMOVE FROM CART (user)
	routerUser.route("/del/cart/:id")
	.get(function(req,res){
		console.log(req.params.id+"ian");
		db("carts").destroy({item_id:req.params.id}).exec(function(err,cart){
			res.status(200).json({message:"Item Deleted"});
		});
	});
	
	//REMOVE ALL DEVICE'S CART (user)
	routerUser.route("/remove/cart/:device_id")
	.get(function(req,res){
		db("carts").destroy({device_id:req.params.device_id}).exec(function(err,cart){
			res.status(200).json({message:"Cart Deleted"});
		});
	});
	
	

//GET ALL RESTAURANTS (user)
	routerUser.route("/restaurant/getrestaurants")
	.post(function(req,res){
		
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		if(typeof req.body.data.lat=='undefined' || typeof req.body.data.lan=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		var lat=req.body.data.lat;
		var lan=req.body.data.lan;
		
		var origins = [];
		var destinations = [];
		
		var restRangeList=[];
		var menus;
		var index=0;
		
		new Promise(function(resolve, reject) {
			geocoder.reverse({lat:lat, lon:lan}, function(err, res) {
				if(err)
				{
					return res.status(400).send({ message: 'Invalid Lat/Lon' });
				}
				origins.push(res[0].zipcode);
			});
			setTimeout(() => resolve(1), 1000);
							
		}).then(function() {
			new Promise(function(resolve, reject) {
				db("menus").find().exec(function(err,men){
					menus=men;
				});
				db("restaurants").find().exec(function(err,rests){
					if(rests)
					{
						var curDate=new Date();
						var curHours=curDate.getHours();
						var curMins=curDate.getMinutes();
						console.log("----------curHours-------------");
						console.log(curHours);
						console.log("-----------curHours------------");
						var curTime=parseInt(curMins)+parseInt(curHours*60);
						
						for(j=0;j<rests.length;j++){
							
							/*var dbOpen=rests[j].restaurant_opening_time;
									
							var openHour=dbOpen.substring(0, 2);
							var openMins=dbOpen.substring(3, 5);
							var openTime=parseInt(openMins)+parseInt(openHour*60);
					
							var dbClose=rests[j].restaurant_closing_time;
							var closeHour=dbClose.substring(0, 2);
							var closeMins=dbClose.substring(3, 5);
							var closeTime=parseInt(closeMins)+parseInt(closeHour*60);

							if(curTime>=openTime && curTime<=closeTime && rests[j].restaurant_status!="Quiet")
							{	
								console.log(rests[j].restaurant_id+"Internal");
								destinations.push(rests[j].restaurant_postal_code);							
							}*/
							destinations.push(rests[j].restaurant_postal_code);	
							if(j==(rests.length-1))
							{
								distancel.matrix(origins, destinations, function (err, distances) {	
									
									if (err) {
										return res.status(400).json({ message:"Error.",err});
									}
									if(!distances) {
										
										return res.status(404).json({ message:"No Distance Found."});
										
									}
									if (distances.status == 'OK') {
										for (var i=0; i < origins.length; i++) {
											for (var j = 0; j < destinations.length; j++) {
												var origin = distances.origin_addresses[i];
												var destination = distances.destination_addresses[j];
												if (distances.rows[0].elements[j].status == 'OK') {
													var distance = distances.rows[i].elements[j].distance.text;
													console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance);
													if(parseInt(distance)<= 2.5)
													{
														var dbOpen=rests[j].restaurant_opening_time;
														var openHour=dbOpen.substring(0, dbOpen.indexOf(':'));
														var openMins=dbOpen.substring(dbOpen.indexOf(':')+1, dbOpen.length);
														var openTime=parseInt(openMins)+parseInt(openHour*60);
												
														var dbClose=rests[j].restaurant_closing_time;
														var closeHour=dbClose.substring(0, dbClose.indexOf(':'));
														var closeMins=dbClose.substring(dbClose.indexOf(':')+1, dbClose.length);
														var closeTime=parseInt(closeMins)+parseInt(closeHour*60);
														console.log("========");
															console.log(curTime);
															console.log("========");
															console.log(openTime);
															console.log("========");
															console.log(closeTime);
														if(curTime>=openTime && curTime<=closeTime && rests[j].restaurant_status!="Quiet")
														{	

															restRangeList.push(rests[j]);
														}

													}
												} 
												else 
												{
													console.log(destination + ' is not reachable by land from ' + origin);
												}
											}
										}
									}
								});
							}
						}
					}						
				});										
					setTimeout(() => resolve(1), 3000);
										
				}).then(function() {
					console.log("----------------------");
					console.log(restRangeList.length);
					console.log("----------------------");
					if(restRangeList.length>0)
					{
						return res.status(200).json({restRangeList,menus});
					}
					if(restRangeList.length<1)
					{
						return res.status(404).json({ message:"No Record Found."});					
					}		

				});
														
			});			
		
	});
	
//SEARCH RESTAURANTS BY POSTALCODE (user)
	routerUser.route("/search/restaurants")
	.post(function(req,res){
		
		if(typeof req.body.postalCode=='undefined')
		{
			return res.status(400).json({message:"Postal Code Not Defined."});
		}
		
		var origins = [req.body.postalCode];
		var destinations = [];
					var restRangeList=[];
					var menus;
					new Promise(function(resolve, reject) {
						db("menus").find().exec(function(err,men){
							menus=men;
						});
						db("restaurants").find().exec(function(err,rests){
							if(rests)
							{
								var curDate=new Date();
								var curHours=curDate.getHours();
								var curMins=curDate.getMinutes();
								var curTime=parseInt(curMins)+parseInt(curHours*60);
								
								for(j=0;j<rests.length;j++){
																		
									/*var dbOpen=rests[j].restaurant_opening_time;
									
									var openHour=dbOpen.substring(0, 2);
									var openMins=dbOpen.substring(3, 5);
									var openTime=parseInt(openMins)+parseInt(openHour*60);
									
									var dbClose=rests[j].restaurant_closing_time;
									var closeHour=dbClose.substring(0, 2);
									var closeMins=dbClose.substring(3, 5);
									var closeTime=parseInt(closeMins)+parseInt(closeHour*60);
					
									if(curTime>=openTime && curTime<=closeTime && rests[j].restaurant_status!="Quiet")
									{
										//destinations = ['New York NY', '41.8337329,-87.7321554']
										destinations.push(rests[j].restaurant_postal_code);
									}*/
									destinations.push(rests[j].restaurant_postal_code);
									if(j==(rests.length-1))
									{
										distancel.matrix(origins, destinations, function (err, distances) {							
											if (err) {
												return res.status(400).json({ message:"Error.",err});
											}
											if(!distances) {
												return res.status(404).json({ message:"No Distance Found."});
											}
											if (distances.status == 'OK') {
												for (var i=0; i < origins.length; i++) {
													for (var j = 0; j < destinations.length; j++) {
														var origin = distances.origin_addresses[i];
														var destination = distances.destination_addresses[j];
														if (distances.rows[0].elements[j].status == 'OK') {
															var distance = distances.rows[i].elements[j].distance.text;
															console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance);
															if(parseInt(distance)<= 2.5)
															{

		
																var dbOpen=rests[j].restaurant_opening_time;
																var openHour=dbOpen.substring(0, dbOpen.indexOf(':'));
																var openMins=dbOpen.substring(dbOpen.indexOf(':')+1, dbOpen.length);
																var openTime=parseInt(openMins)+parseInt(openHour*60);
																
																var dbClose=rests[j].restaurant_closing_time;																
																var closeHour=dbClose.substring(0, dbClose.indexOf(':'));
																var closeMins=dbClose.substring(dbClose.indexOf(':')+1, dbClose.length);
																var closeTime=parseInt(closeMins)+parseInt(closeHour*60);

																console.log("--------curHours------");
																console.log(curHours);

																console.log("--------curMins------");
																console.log(curMins);
															
																console.log("--------openTime------");
																console.log(openTime);
															
																console.log("--------closeTime------");
																console.log(closeTime);
																
						
																if(curTime>=openTime && curTime<=closeTime && rests[j].restaurant_status!="Quiet")
																{
																	console.log("curtime");
																	restRangeList.push(rests[j]);
																}
																
															}
														} 
														else 
														{
															console.log(destination + ' is not reachable by land from ' + origin);
														}
													}
													
												}
											}
										});
									}
								}
							}						
					});
					
						setTimeout(() => resolve(1), 3000);			
					}).then(function() {	
								console.log("-------------------");
								console.log(restRangeList.length);
								console.log("-------------------");
								if(restRangeList.length>0)
								{
									return res.status(200).json({restRangeList,menus});
								}
								if(restRangeList.length<1)
								{
									return res.status(404).json({ message:"No Record Found."});					
								}
							});
		});		
		
	//GET RESTAURANTS DETAIL (user)
	routerUser.route("/restaurant/getrestaurantdetail/:id")
	.get(function (req,res){
		
		//var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		//if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		//jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				/*db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{*/
					var response;
					var itemsResponse=[];
					var index=0;
					new Promise(function(resolve, reject) {
						db("restaurants").findOne(req.params.id)
						.populate("menu_id")
						.exec(function(req,resp){
							if(resp)
							{
								response=resp;
								response.menu_id.forEach(function(menu) {
												
									db("menus").findOne(menu.menu_id)
									.populate("fooditem_to_menu_Fk")
									.exec(function(rqst,rsp){
										itemsResponse[index]=rsp;
										index++;
													//console.log(index+"index");
									});
								});
							}
									
						});
						setTimeout(() => resolve(1), 100);
					}).then(function() {
									//var respo= Object.assign(response, itemsResponse);
									//console.log(respo);
							return res.status(200).send({response,itemsResponse});
						});
							
						/*break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});
						
		});*/	
	});
	
	
	
	//USER PROFILE (user)
	routerUser.route("/user/getprofile/:id")
	.get(function (req,res){
	
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("users").findOne({"user_id":req.params.id}).exec(function (err,user){
									response=user;
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								if(response)
									return res.status(200).json({response});
									return res.status(404).send({message:"No Record Found."});
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	//UPDATE PROFILE (user)
	routerUser.route("/user/updateprofile")
	.put(function(req,res){
	
	//check body
		if(typeof req.body=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNjAwNjQsImV4cCI6MTUxNjM0NjQ2NH0.xGlBQoDpUnLJ973_2od0AAvXwWVTLh_XQWH-YIU3GF4";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								//new added
								db("users").findOne({"user_id":users[i].user_id})
								.populate("locations_to_user_Fk")
								.populate("order_to_user_Fk")
								.exec(function (err,user){

									/*console.log("-------------------");
									console.log(user.locations_to_user_Fk.length);
									console.log("-------------------");
									console.log("-------------------");
									console.log(user);
									console.log("-------------------");*/

								/*console.log("-------------------");
									console.log(req.body);
									console.log("-------------------");*/
									user.user_name=req.body.user_name;
									user.user_mobile_no=req.body.user_mobile_no;
									console.log("-------------------");
									console.log(user);
									console.log("-------------------");

									
									for(var i=0;i<user.locations_to_user_Fk.length;i++){
										user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
									}
									for(var i=0;i<user.order_to_user_Fk.length;i++){
										user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
									}
									user.save();					
									response=user;
								});
								//new above
								/*db("users").update(req.body.user_id,req.body).exec(function (err,user){
									response=user;
								});*/
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'User Updated.',response });
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	//UPDATE FIREBASE TOKEN (user)
	routerUser.route("/user/update/firebase")
	.put(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.firebase_token=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNjAwNjQsImV4cCI6MTUxNjM0NjQ2NH0.xGlBQoDpUnLJ973_2od0AAvXwWVTLh_XQWH-YIU3GF4";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								//new added
								db("users").findOne({"user_name":users[i].user_name,"user_password":users[i].user_password})
								.populate("locations_to_user_Fk")
								.populate("order_to_user_Fk")
								.exec(function (err,user){
									user.user_firebase_token=req.body.data.firebase_token;
									for(var i=0;i<user.locations_to_user_Fk.length;i++){
										user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
									}
									for(var i=0;i<user.order_to_user_Fk.length;i++){
										user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
									}
									user.save();					
									response=user;
								});
								//new above
								/*db("users").update(req.body.user_id,req.body).exec(function (err,user){
									response=user;
								});*/
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								if(response)
									return res.status(200).send({message: 'User Updated.',response });
									//return res.status(404).send({message: 'No Record Found.'});
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
	//POST USER LOCATION (user)
	routerUser.route("/add/location")
	.post(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							new Promise(function(resolve, reject) {
								db("locations").create(req.body.data).exec(function(err,record){
									if(!err)
									{
										res.status(200).json({ message:"Location has been added", record });	
									}
									if(err)
									{
										res.status(404).json({ message:"Unable to add location", err });	
									}
								});
								
								setTimeout(() => resolve(1), 500);
							}).then(function() {
									
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	//GET USER LOCATION (user)
	routerUser.route("/get/user/locations/:id")
	.get(function (req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;						
							new Promise(function(resolve, reject) {
								db("users").findOne(req.params.id)
								.populate("locations_to_user_Fk")
								.exec(function(req,rsp){
									response=rsp;									
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								console.log("-----------------------");
									console.log( response.locations_to_user_Fk );
									console.log("-----------------------");
								var userLocations=[];
								var index=0;
									response.locations_to_user_Fk.forEach(function(user) {
										userLocations[index]=user;
										index++;		
									});
									/*console.log("-----------------------");
									console.log(userLocations);
									console.log("-----------------------");*/
								return res.status(200).send({userLocations});
								
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	
	//REMOVE USER LOCATIONS (user)
	routerUser.route("/delete/user/locations/:id/:loc")
	.delete(function(req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;						
							new Promise(function(resolve, reject) {
								db("locations").destroy({user_id:req.params.id,user_address:req.params.loc}).exec(function(err,response){
									if(err)
										return res.status(404).send({ message: 'Location cant be deleted.',err });
										return res.status(200).send({ message: 'Location has been deleted.'});
										
								});
								setTimeout(() => resolve(1), 200);
							}).then(function() {
								
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//POST ORDER USER (for user)
	routerUser.route("/post/order")
	.post(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.orderinfo=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		var orderid;
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							new Promise(function(resolve, reject) {
								db("orders").create(req.body.data).exec(function(err,order){
									var fooditemsArray=req.body.data.orderinfo;
									orderid=order.order_id;
									for(var j=0;j<fooditemsArray.length;j++)
									{
										console.log("j");
										
										console.log(req.body.data.orderinfo.length);
										for(var i=0;i<fooditemsArray[j].quantity;i++)
										{
											db("ordersitems").create({"order":order.order_id,"fooditem":fooditemsArray[j].id}).exec(function(error,third){
												/*if(!error && i==req.body.quantity-1)
												{
													return res.status(200).json({ message:"Order saved", third });	
												}*/
												if(error)
												{
													return res.status(404).json({ message:"Unable to save order", error });	
												}
											  
											});
										}
									}
									
								});
								
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								notify_restaurant_on_new_order(req.body.data.restaurant_id,orderid);
									return res.status(200).json({ message:"Order saved"});
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	//GET SINGLE ORDER FOR RIDER TRACKING(for user)
	routerUser.route("/get/order/tracking/:id")
	.get(function (req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNzIzNTgsImV4cCI6MTUxNjM1ODc1OH0.TJDkSBSzQ1GL4CA-fb8dkFRReA-GqyWZVyDPozmXXQQ";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;	
							var index=0;
							new Promise(function(resolve, reject) {
								db("orders").findOne(req.params.id)
								.populate("rider_id")
								.exec(function(err,order){
									response=order;
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								if(response)
								return res.status(200).send({response});
								return res.status(404).send({message:"No Record Found."});
							});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	
	//GET ORDERS DETAIL(for user)
	routerUser.route("/get/orders/detail/:id")
	.get(function (req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUxOTc1MjE3NSwiZXhwIjoxNTE5ODM4NTc1fQ.TcHSIndnH_gv6T1PU7LXFYOBsKuZWbVPy8Hntxr2J64";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response=[];	
							var index=0;
							new Promise(function(resolve, reject) {
								db("orders").find()
								.populate("restaurant_id")
								.populate("rider_id")
								.populate("fooditem_to_order_Fk")
								.exec(function(err,orders){
									orders.forEach(function(order) {
										if(order.user_id==req.params.id)
										{
											//console.log(order.user_id+"is equal"+req.params.id);
											response[index]=order;
											index++;
										}
									});
									
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
											console.log("--------------------responce length-------------------------------");
														console.log(response.length);
								console.log("--------------------responce length-------------------------------");
								if(response.length>0)
								return res.status(200).send({response});
								return res.status(404).send({message:"No Record Found."});
							});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//NOTIFY USER (user)
	routerUser.route("/notify/user/:user_id")
	.post(function (req,res){
		var serverKey = 'AIzaSyCnYp4M3-dUo9ORAi4uTA-forhmR0T7HBY';
		var UserFcm = new FCM(serverKey);
		db("users").findOne({"user_id":req.params.user_id})
		.exec(function (err,user){	
			if(err)
			{
				return res.status(404).send({ message: 'No Record Found.',err });
			}
			var message = {
				to: user.user_firebase_token, // required fill with device token or topics
				//to: 'eOS6Mgns5l4:APA91bHXYvGeStMLLSKSdvYPwC8tp1EdaRrdSYh5gxVZGbBJP4KddYsNIebBrVVBdv7aZBWYyqEuMC4vqcOs2zmfuON0nrEt5tr58gGABytnBNKH_Lx69Pzb9JcLGERcVEYgjRWdrV3A', // required fill with device token or topics
				collapse_key: 'your_collapse_key', 
				data: {
					your_custom_data_key: 'your_custom_data_value'
					//order_id: req.params.order_id
				},
				notification: {
					title: 'information !',
					body: 'Your order has been rejected.'
				}
			};

			//callback style
			UserFcm.send(message, function(err, response){
			if (err) {
					console.log("Something has gone wrong!");
				} else {
					console.log("Successfully sent with response: ", response);
				}
			});

					/*//promise style
					UserFcm.send(message)
						.then(function(response){
							console.log("Successfully sent with response: ", response);
						})
						.catch(function(err){
							console.log("Something has gone wrong!");
							console.error(err);
						})*/
		
			return res.status(200).json({ message:"The order is Successfully rejected."});	
							
		});		
	});
	
	//LOGOUT USER (user)
	routerUser.route("/user/logout")
	.put(function(req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUxODcwMzA1MSwiZXhwIjoxNTE4Nzg5NDUxfQ.sIZ4Eks8eZRvuF0bEB77TCj7ARBY0yxIzarjTFicOOk";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("users").find().exec(function(err,users){
					for(i=0;i<users.length;i++){
						if(users[i].user_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("users").findOne({"user_name":users[i].user_name,"user_password":users[i].user_password})
								.populate("locations_to_user_Fk")
								.populate("order_to_user_Fk")
								.exec(function (err,user){
									user.user_token=null;
									for(var i=0;i<user.locations_to_user_Fk.length;i++){
										user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
									}
									for(var i=0;i<user.order_to_user_Fk.length;i++){
										user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
									}
									user.save();					
									response=user;
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'User Updated.',response });
								});
							break;
						}
						else if((i==(users.length-1)) && users[i].user_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	

	//RIDER API'S
	
	//RIDER LOGIN
	routerUser.route("/rider/login")
	.post(function(req,res){
				
	//check body
		if(typeof req.body=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.rider_username=='undefined' || typeof req.body.rider_password=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		
		var riderusername=req.body.rider_username;
		var pswd=req.body.rider_password;
		
		var token ;		
		db("riders").findOne({"rider_username":riderusername,"rider_password":pswd})
		.populate("order_to_rider_Fk")
		.populate("feedback_id")
		.exec(function (err,rider){
					
			if (!rider) return res.status(404).send("There was a problem finding the rider.");	
			// create a token			
			token = jwt.sign({ id:pswd}, config.secret, {
				expiresIn: 86400 // expires in 24 hours
			});
			rider.rider_token=token;	
			for(var i=0;i<rider.order_to_rider_Fk.length;i++){
				rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
			}
			for(var i=0;i<rider.feedback_id.length;i++){
				rider.feedback_id.add(rider.feedback_id[i].rider_email);				
			}
			rider.save();					
			res.status(200).json({ auth: true, token: token, rider });
		});		
	});  


//FORGET PASSWORD RIDER
	routerUser.route("/rider/forget/password")
	.put(function(req,res){
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
			
		if(typeof req.body.data.rider_email=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
			
		var rider_email=req.body.data.rider_email;
				
		db("riders").findOne({"rider_email":rider_email})
		.populate("order_to_rider_Fk")
		.populate("feedback_id")
		.exec(function (err,rider){			
			if(rider){
				rider.rider_password=rider_email;	
						
				var mailOptions = {
					from: '13151556-026@uog.edu.pk',
					to: rider_email,
					subject: "subject",
					text: "Your New Password is : "+" "+rider_email+" "+" kindly change it at your first login!"
				};

				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
						console.log(error);
					} 
					else {
						console.log('Email sent: ' + info.response);
						return res.send('Email sent: ' + info.response);
					}
				});
					
				for(var i=0;i<rider.order_to_rider_Fk.length;i++){
					rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
				}
				for(var i=0;i<rider.feedback_id.length;i++){
					rider.feedback_id.add(rider.feedback_id[i].rider_email);				
				}
				rider.save();												
								
				return res.status(200).send({message: 'Password Changed!'});
								
			}
			else{
				return res.status(404).send({message: 'No Record With This Email Exist!'});
			}
		});	
	});
	
	//CHANGE PASSWORD RIDER
	routerUser.route("/change/rider/password/:id")
	.put(function(req,res){	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.curr_password=='undefined' || typeof req.body.data.new_password=='undefined'
			|| typeof req.body.data.rider_email=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var curr_password=req.body.data.curr_password;
		var new_password=req.body.data.new_password;
		var rider_email=req.body.data.rider_email;
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDUxOTIyNywiZXhwIjoxNTIwNjA1NjI3fQ.j5TKv7DGvPZkGFKfdEjicKJmeihKypQrc-3wvgSCF5c";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
			db("riders").find().exec(function(err,riders){
				if(riders)
				{
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{
							db("riders").findOne({"rider_email":rider_email,"rider_password":curr_password})
							.populate("order_to_rider_Fk")
							.populate("feedback_id")
							.exec(function (err,rider)
							{		
								if(rider)
								{
									rider.rider_password=new_password;	
						
									var mailOptions = {
										from: '13151556-026@uog.edu.pk',
										to: rider_email,
										subject: "subject",
										text: "Your Password Has Been Changed!"
									};

									transporter.sendMail(mailOptions, function(error, info){
										if (error) {
											console.log(error);
										} 
										else {
											console.log('Email sent: ' + info.response);
											return res.send('Email sent: ' + info.response);
										}
									});
										
									for(var i=0;i<rider.order_to_rider_Fk.length;i++){
										rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
									}
									for(var i=0;i<rider.feedback_id.length;i++){
										rider.feedback_id.add(rider.feedback_id[i].rider_email);				
									}
									rider.save();												
													
									return res.status(200).send({message: 'Password Changed!'});
													
								}
								else{
									return res.status(404).send({message: 'No Record With This Email Exist!'});
								}
							});	
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				}
				else
					return res.status(404).send({message: 'No Record With This Email Exist!'});
			});	
		});				
				
	});	
	
	//GET ORDERS DETAIL(for rider)
	routerUser.route("/rider/today/orders/detail/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE5MzA4NzMxLCJleHAiOjE1MTkzOTUxMzF9.ug7atuZvP73wqmTb9YQO4NAI53BbOcSL-xuJ--FOPbs";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response=[];	
							var index=0;
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {

										if(order.rider_id==req.params.id)
										{
											//console.log(order);
											var ordrDlvrdAt=new Date(order.order_delivered_at);
											var dbday = ordrDlvrdAt.getDate();
											var dbmonth = ordrDlvrdAt.getMonth();
											var dbyear = ordrDlvrdAt.getFullYear();
											

											var reqdatetime=new Date(req.body.data.data);
											var reqday=reqdatetime.getDate();
											var reqmonth=reqdatetime.getMonth();
											var reqyear=reqdatetime.getFullYear();
											
											//console.log(reqday);
											//console.log(dbday);
											if(reqday==dbday && dbmonth==reqmonth && dbyear==reqyear)
											{
												//console.log(order.rider_id+"is equal"+req.params.id);
												response[index]=order;
												index++;
											}
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								//console.log(response.length);
								if(response.length>0)
									return res.status(200).json({response});
									return res.status(404).json({message:'No Record Found.'});
							});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET ORDERS DETAIL(for rider)
	routerUser.route("/rider/week/orders/detail/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.dataWeek=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.dataWeek.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response=[];	
							var index=0;
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										console.log(order);
										if(order.rider_id==req.params.id)
										{
											var arr=[];
											var reqdatetime=new Date(req.body.dataWeek.data);
											
											
											var dbdatetime=new Date(order.order_delivered_at);
											var dbday=dbdatetime.getDate();
											var dbmonth=dbdatetime.getMonth();
											var dbyear=dbdatetime.getFullYear();
												
											for(var i=1;i<=7;i++)
											{
											
												
												arr[i-1]=reqdatetime;
												
												/*console.log(arr[i-1].getDate()+"arr date");
												console.log(dbday+"db date");
												console.log(arr[i-1].getMonth()+"arr month");
												console.log(dbmonth+"db month");
												console.log(arr[i-1].getFullYear()+"arr year");
												console.log(dbyear+"db year");
												*/
												console.log("_________________");
												console.log(req.body.dataWeek.data);
												
																		
												if(arr[i-1].getDate()==dbday && arr[i-1].getMonth()==dbmonth && arr[i-1].getFullYear()==dbyear)
												{
													console.log(order.rider_id+"is equal"+req.params.id);
													response[index]=order;
													index++;
													break;
												}
												reqdatetime.setDate(reqdatetime.getDate()-1);
											
											}
											
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								if(response.length>0)
								return res.status(200).send({response});
								return res.status(404).send({message:"No record found."});
							
							});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET ORDERS DETAIL(for rider)
	routerUser.route("/rider/month/orders/detail/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var week1=[];	
							var week2=[];	
							var week3=[];	
							var week4=[];	
							var week5=[];	
					
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										//console.log(order);
										if(order.rider_id==req.params.id)
										{
											var arr=[];
											var reqdatetime=new Date(req.body.data.data);
											//var reqdate=reqdatetime.getDate();
											var reqmonth=reqdatetime.getMonth();
											var reqyear=reqdatetime.getFullYear();
											
											
											var dbdatetime=new Date(order.order_delivered_at);
											var dbday=dbdatetime.getDate();
											var dbmonth=dbdatetime.getMonth();
											var dbyear=dbdatetime.getFullYear();
											
													
											if(dbmonth==reqmonth && dbyear==reqyear)
											{
												if(dbday<=7)
													week1.push(order);
												if(dbday>7 && dbday<=14)
													week2.push(order);
												if(dbday>14 && dbday<=21)
													week3.push(order);
												if(dbday>21 && dbday<=28)
													week4.push(order);
												if(dbday>28 && dbday<=31)
													week5.push(order);
											
											}		
																						
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								if(week1.length>0 || week2.length>0 || week3.length>0 || week4.length>0 || week5.length>0)
									return res.status(200).send({week1,week2,week3,week4,week5});
								return res.status(404).send({message:"No record found."});
							
							});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	
	//UPDATE RIDER LAT LAN (RIDER)
	routerUser.route("/update/rider/lat/lan/:id")
	.put(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"Body Not Attatched."});
		}
		
		if(typeof req.body.data.lat=='undefined' || typeof req.body.data.lan=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		//var token=req.body.token;
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("riders").findOne({"rider_id":riders[i].rider_id})
								.populate("order_to_rider_Fk")
								.populate("feedback_id")
								.exec(function (err,rider){	
									rider.rider_lat=req.body.data.lat;	
									rider.rider_lan=req.body.data.lan;	
									for(var i=0;i<rider.order_to_rider_Fk.length;i++){
										rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
									}
									for(var i=0;i<rider.feedback_id.length;i++){
										rider.feedback_id.add(rider.feedback_id[i].rider_email);				
									}
									rider.save();					
									response=rider;
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Rider LAT/LON Updated.',response });
								});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
	//UPDATE RIDER FIREBASE TOKEN (RIDER)
	routerUser.route("/update/rider/firebase/token/:id")
	.put(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.firebase_token=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("riders").findOne({"rider_id":riders[i].rider_id})
								.populate("order_to_rider_Fk")
								.populate("feedback_id")
								.exec(function (err,rider){	
									rider.firebase_token=req.body.data.firebase_token;		
									for(var i=0;i<rider.order_to_rider_Fk.length;i++){
										rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
									}
									for(var i=0;i<rider.feedback_id.length;i++){
										rider.feedback_id.add(rider.feedback_id[i].rider_email);				
									}
									rider.save();					
									response=rider;
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Rider FireBase Token is Updated.',response });
								});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
//NOTIFY RIDER ON ORDER (RIDER)
//NOTIFY RIDER ON ORDER (RIDER)
routerUser.route("/notify/riders/:order_id")
    .post(function (req,res){

        db("bookings").find()
            .populate("rider_id")
            .exec(function (err,rec){
                if(err)
                {
                    return res.status(404).send({ message: 'No Record Found.',err });
                }

                var rider_firebase_tokens=[];

                var currentDate=new Date();
                var currDay=currentDate.getDate();
                var currMonth=currentDate.getMonth();
                var currYear=currentDate.getFullYear();
                var currHours=currentDate.getHours();


                for(let i = 0;i < rec.length;i++){

                    var recDate=rec[i].date.getDate();
                    var recMonth=rec[i].date.getMonth();
                    var recYear=rec[i].date.getFullYear();
                    var recHours=rec[i].date.getHours();

                    var str=rec[i].timeslot;
                    var tmslot = str.substring(0, 2);

                    console.log(currHours+"and"+tmslot);
                    console.log(currDay+"and"+recDate);
                    console.log(currMonth+"and"+recMonth);
                    console.log(currYear+"and"+recYear);

                    if(recDate==currDay && recMonth==currMonth
                        && recYear==currYear && tmslot>=currHours && rec[i].rider_id.rider_status=="online")
                    {
                        console.log("same"+rec[i].rider_id.firebase_token);
                        if(rider_firebase_tokens.length>0){
                            var chk_rider=0;
                            for(var ind=0;ind<rider_firebase_tokens.length;ind++){
                                if(rider_firebase_tokens[ind]==rec[i].rider_id.firebase_token){
                                    chk_rider=1;
                                }
                                else if(chk_rider==0 && ind==rider_firebase_tokens.length-1){
                                    rider_firebase_tokens.push(rec[i].rider_id.firebase_token);
                                }
                            }
                        }
                        else{
                            rider_firebase_tokens.push(rec[i].rider_id.firebase_token);
                        }
                    }
                }
                if(rider_firebase_tokens.length<1)
                {
                    return res.status(404).send({ message: 'Unable To Get Any Records.'});
                }
                if(rider_firebase_tokens.length>0)
                {
                    for(var i=0;i<rider_firebase_tokens.length;i++)
                    {
                        var message = {
                            to: rider_firebase_tokens[i], // required fill with device token or topics
                            //to: 'eOS6Mgns5l4:APA91bHXYvGeStMLLSKSdvYPwC8tp1EdaRrdSYh5gxVZGbBJP4KddYsNIebBrVVBdv7aZBWYyqEuMC4vqcOs2zmfuON0nrEt5tr58gGABytnBNKH_Lx69Pzb9JcLGERcVEYgjRWdrV3A', // required fill with device token or topics
                            collapse_key: 'your_collapse_key',
                            data: {
                                //your_custom_data_key: 'your_custom_data_value'
                                order_id: req.params.order_id
                            },
                            notification: {
                                title: 'ORDER !',
                                body: 'You Have An Order.'
                            }
                        };

                        //callback style
                        fcm.send(message, function(err, response){
                            if (err) {
                                console.log("Something has gone wrong!");
                            } else {
                                console.log("Successfully sent with response: ", response);
                            }
                        });

                        /*//promise style
                        fcm.send(message)
                            .then(function(response){
                                console.log("Successfully sent with response: ", response);
                            })
                            .catch(function(err){
                                console.log("Something has gone wrong!");
                                console.error(err);
                            })*/
                    }
                    return res.status(200).json({ message:"All Riders.",rider_firebase_tokens});
                }

            });
    });
	

	//ASSIGN ORDER TO RIDER(rider)
	routerUser.route("/accept/reject/order/:rider_id")
	.put(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.order_id=='undefined' || typeof req.body.data.order_status=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers.token=='undefined'  || req.headers.token.length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =req.headers.token;
		
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTIwMzY1MzQzLCJleHAiOjE1MjA0NTE3NDN9.p6ZENh24cpnZ9uTQeoQwEAHsmQavIFA6K0P7MvP0Ywc";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("orders").findOne({"order_id":req.body.data.order_id})
								.populate("user_id")
								//.populate("fooditem_to_order_Fk")
								.exec(function (err,order){	
								if(order)
								{
									var asgnAt=new Date();
									order.order_assigned_at=asgnAt;				
									order.rider_id=req.params.rider_id;	
									order.rider_status=req.body.data.order_status;	
									/*for(var a=0;a<order.fooditem_to_order_Fk.length;a++){
										order.fooditem_to_order_Fk.add(order.fooditem_to_order_Fk[a].id);
									}*/
									order.save();
									response=order;
								}
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Order Accepted.',response });
								});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	//ASSIGN ORDER TO RIDER(rider)
	routerUser.route("/order/completed/:rider_id")
	.put(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.order_id=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers.token=='undefined'  || req.headers.token.length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =req.headers.token;
		//var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTIwMzY1MzQzLCJleHAiOjE1MjA0NTE3NDN9.p6ZENh24cpnZ9uTQeoQwEAHsmQavIFA6K0P7MvP0Ywc";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("orders").findOne({"order_id":req.body.data.order_id})
								.populate("user_id")
								//.populate("fooditem_to_order_Fk")
								.exec(function (err,order){
									if(order)
									{
										order.order_status="Completed";	
										order.rider_status="Reached";	
										/*for(var a=0;a<order.fooditem_to_order_Fk.length;a++){
											order.fooditem_to_order_Fk.add(order.fooditem_to_order_Fk[a].id);
										}*/
										order.save();
										response=order;
									}
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								if(response)
									return res.status(200).send({message: 'Order Marked As Completed & Reached.',response });
								return res.status(404).send({message: 'No Matching Order Found.',response });
								});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
	
	
	//POST TO FEEDBACK (RIDER)
	routerUser.route("/add/feedback")
	.post(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		
		db("feedbacks").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"Feedback Added.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable To Add Feedback.", err });	
			}
		
		});
	});
	//GET TIMESLOTS (RIDER)
	routerUser.route("/get/timeslots")
	.get(function (req,res){
		db("timeslots").find()
		.exec(function (err,timeslots){
			if(err)
				res.status(404).json({err});					
				res.status(200).json({timeslots});						
		});		
	});
	
	//POST TO BOOKINGS (RIDER)
	routerUser.route("/add/booking")
	.post(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		
		db("bookings").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"Booking Added.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable To Add Booking.", err });	
			}
		
		});
	});
	//GET DAYS AND SESSIONS FROM BOOKING (RIDER)
	routerUser.route("/get/rider/sessions/:id")
	.get(function (req,res){
		var urlid=req.params.id;
		db("bookings").find()
		.exec(function (err,rec){
			if(err)
			{
				return res.status(401).send({ message: 'No Record Found.',err });
			}
				var response=[];
				class cls{
						constructor() {
						this.day =0;
						this.session =1;
					  }
				}
				var record=[];
				for(let i = 0;i < rec.length;i++){
					var today=new Date();
					var todayDate=today.getDate();
					var todayMonth=today.getMonth();
					var todayYear=today.getFullYear();
					var todayHours=today.getHours();
					
					var recDate=rec[i].date.getDate();
					var recMonth=rec[i].date.getMonth();
					var recYear=rec[i].date.getFullYear();
					var recHours=rec[i].date.getHours();
					
					var finallimit=new Date();
					finallimit.setDate(todayDate+7);
					finallimit.setHours(00);
					finallimit.setMinutes(00);
					finallimit.setSeconds(00);
					var finalDate=finallimit.getDate();
					var finalMonth=finallimit.getMonth();
					var finalYear=finallimit.getFullYear();
					var finalHours=finallimit.getHours();
					//console.log(rec[i].date.getDate());
					//console.log(rec[i].booking_id+"Full"+finallimit+"Date"+recDate+"recMonth"+recMonth);
					var abc=new Date(recYear,recMonth,recDate,23,59,59);
					rec[i].date=abc;
					if(urlid == rec[i].rider_id && rec[i].date>=today && rec[i].date<finallimit){								
								if(todayDate==recDate && todayMonth==recMonth && todayYear==recYear)
								{
									//console.log("sameeeeeee dayyyyyyyy");
									var str=rec[i].timeslot;
									var tmslot = str.substring(0, 2);
									//console.log(todayHours+"and"+tmslot);
									if(tmslot>=todayHours)
									{
										//console.log("pushed today big tmslottttttttttttttttttttttttttttt");
										response.push(rec[i]);
									}
								}
								else{
									//console.log("pushed bigger dayyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy");
									response.push(rec[i]);
								}
					}
					if(i==(rec.length-1))
					{
						for(let j = 0;j < response.length;j++){
							
							var abc=new cls();
							abc.day=response[j].date.getDate();
							abc.session=1;
							
							for(let k = 0;k < response.length;k++){								
								if(response[j].date.getDate()==response[k].date.getDate() && k!=j)
								{
									abc.session=abc.session+1;
								}
							}
							if(record.length==0)
							{
								record.push(abc);
							}
							else if(record.length>0)
							{
								for(let l = 0;l < record.length;l++){
									if(record[l].day==abc.day)
									{
										record[l].session=abc.session;
										break;
									}								
									if(record[l].day!=abc.day && l==(record.length-1))
									{									
										record.push(abc);
									}
								}
							}
						}
					}
				}
				if(record.length<1)
				{
					return res.status(404).send({ message: 'Unable To Get Any Records.'});	
				}
				if(record.length>0)
				{
					return res.status(200).json({ message:"Days And Sessions.",record});	
				}
							
		});		
	});
	
	//GET FROM BOOKING (RIDER)
	routerUser.route("/get/bookings/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.date=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		var urlid=req.params.id;
		db("bookings").find()
		.exec(function (err,rec){
			if(err)
			{
				return res.status(404).send({ message: 'No Record Found.',err });
			}
				var response=[];
				var currentDate=new Date();
				var currDay=currentDate.getDate();
				var currMonth=currentDate.getMonth();
				var currYear=currentDate.getFullYear();
				var currHours=currentDate.getHours();
				
				var reqdate=new Date(req.body.date);	
				var reqDay=reqdate.getDate();
				var reqMonth=reqdate.getMonth();
				var reqYear=reqdate.getFullYear();
				var reqHours=reqdate.getHours();
				
				console.log(currDay+"curr & req"+reqDay);
				//console.log(reqdate+"req"+reqDay);
				
				if(reqDay==currDay && reqMonth==currMonth && reqYear==currYear)
				{
					for(let i = 0;i < rec.length;i++){
						
						var recDate=rec[i].date.getDate();
						var recMonth=rec[i].date.getMonth();
						var recYear=rec[i].date.getFullYear();
						var recHours=rec[i].date.getHours();
						
						var str=rec[i].timeslot;
						var tmslot = str.substring(0, 2);
						console.log(reqHours+"and"+tmslot);
									
						if(urlid == rec[i].rider_id && recDate==reqDay && recMonth==reqMonth 
							&& recYear==reqYear && tmslot>=reqHours){
							response.push(rec[i]);
						}
					}
				}
				else{
					var j=0;
					for(let i = 0;i < rec.length;i++){
						
						var recDate=rec[i].date.getDate();
						var recMonth=rec[i].date.getMonth();
						var recYear=rec[i].date.getFullYear();
						var recHours=rec[i].date.getHours();
						
						if(urlid == rec[i].rider_id && recDate==reqDay && recMonth==reqMonth 
							&& recYear==reqYear){
								console.log("j"+j);
								j++;
							response.push(rec[i]);
						}
					}
				}
				if(response.length<1)
				{
					return res.status(404).send({ message: 'Unable To Get Any Records.'});	
				}
				if(response.length>0)
				{
					return res.status(200).json({ message:"All Bookings.",response});	
				}
							
		});		
	});
	//RIDER DELETE BOOKING
	routerUser.route("/delete/booking/:id")
	.get(function(req,res){
		db("bookings").destroy({booking_id:req.params.id}).exec(function(err,menu){
			if(!err)
			{
				res.status(200).json({ message:"Booking Deleted.", menu });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable To Delete.", err });	
			}
		
		});
	});
	//ONLINE RIDER(rider)
	routerUser.route("/update/rider/status/:id")
	.put(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.rider_status=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("riders").findOne({"rider_id":riders[i].rider_id})
								.populate("order_to_rider_Fk")
								.populate("feedback_id")
								.exec(function (err,rider){	
									rider.rider_status=req.body.data.rider_status;	
									for(var i=0;i<rider.order_to_rider_Fk.length;i++){
										rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
									}
									for(var i=0;i<rider.feedback_id.length;i++){
										rider.feedback_id.add(rider.feedback_id[i].rider_email);				
									}
									
									
									
									
									
									
										db("bookings").find({"rider_id":req.params.id})
										.exec(function (err,recs){
											var currentDate=new Date();
											var currDay=currentDate.getDate();
											var currMonth=currentDate.getMonth();
											var currYear=currentDate.getFullYear();
											var currHours=currentDate.getHours();
																				
											
											
											for(var a=0;a<recs.length;a++)
											{
												var recDate=recs[a].date.getDate();
												var recMonth=recs[a].date.getMonth();
												var recYear=recs[a].date.getFullYear();
												var recHours=recs[a].date.getHours();
												
												var str=recs[a].timeslot;
												var tmslot = str.substring(0, 2);
											
												if(recDate==currDay && recMonth==currMonth && recYear==currYear && tmslot>=recHours)
												{
													db("bookings").findOne({"rider_id":recs[a].rider_id})
													.exec(function (err,rec){
														
														rec.online_status="online";
														rec.save();
														
													});
												}
											}
											rider.save();					
											response=rider;
											
										});
										
									
									
								});	
									
									
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									return res.status(200).send({message: 'Rider Status Updated.'});
								});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	//GET RIDER STATS(for rider)
	routerUser.route("/rider/stats/:id")
	.get(function (req,res){
	
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers.token=='undefined'  || req.headers.token.length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =req.headers.token;
		//var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTIwNTE4MjU0LCJleHAiOjE1MjA2MDQ2NTR9.HTW7ExmxWs7hv7W_2_zI-dNBG5EVuqrZ27amb-aX_D4";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var accepted=0;
							var ordersLength=0;
							
							var bookingOnline=0;
							var bookingsLength=0;
							
							var attendence_stat;
							var order_stat;
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									db("bookings").find().exec(function(err,bookings){
										
										var currentDate=new Date();
																	
										bookings.forEach(function(booking) {
											if(booking.rider_id==req.params.id)
											{
												var recDate=booking.date;
											
												if(recDate<=currentDate)
												{
													bookingsLength+=1;
													if(booking.online_status=="online")
													{
														bookingOnline+=1;
													}
												}
											}
										});
									});
									orders.forEach(function(order) {

										if(order.rider_id==req.params.id)
										{
											ordersLength+=1;
											if(order.rider_status=="Accepted" || order.rider_status=="Reached")
											{
												accepted+=1;
											}
										}
										
									});
									
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								order_stat=parseFloat((accepted/ordersLength)*100);
								attendence_stat=parseFloat((bookingOnline/bookingsLength)*100);
								if(ordersLength>0)
									return res.status(200).json({order_stat,attendence_stat});
									return res.status(404).json({message:'No Record Found.'});
							});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//RIDER LOGOUT
	routerUser.route("/rider/logout")
	.put(function(req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("riders").find().exec(function(err,riders){
					for(i=0;i<riders.length;i++){
						if(riders[i].rider_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("riders").findOne({"rider_username":riders[i].rider_username,"rider_password":riders[i].rider_password})
								.populate("order_to_rider_Fk")
								.populate("feedback_id")
								.exec(function (err,rider){	
									rider.rider_token=null;	
									for(var i=0;i<rider.order_to_rider_Fk.length;i++){
										rider.order_to_rider_Fk.add(rider.order_to_rider_Fk[i].order_id);
									}
									for(var i=0;i<rider.feedback_id.length;i++){
										rider.feedback_id.add(rider.feedback_id[i].rider_email);				
									}
									rider.save();					
									response=rider;
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Rider Updated.',response });
								});
							break;
						}
						else if((i==(riders.length-1)) && riders[i].rider_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	







		
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////		
	//RESTAURANT'S API'S
	
	//REGISTER RESTAURANT
	routerUser.route("/signup/restaurant")
	.post(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		db("restaurants").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"Restaurant Added.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable to add Restaurant.", err });	
			}
		
		});
	});
	
	
	//RESTAURANT LOGIN
	routerUser.route("/restaurant/login")
	.post(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.restaurant_username=='undefined' || typeof req.body.data.restaurant_password=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		
		var restusername=req.body.data.restaurant_username;
		var pswd=req.body.data.restaurant_password;
		
		var token ;
		var restaurant ;
		
		   		db("restaurants").findOne({"restaurant_username":restusername,"restaurant_password":pswd})
				.populate("menu_id")
				.populate("order_to_retaurant_Fk")
				.exec(function (err,rest){
					if (!rest) return res.status(404).json({message:"There was a problem finding the Restaurant."});
					
					restaurant=rest;
					
					// create a token			
					token = jwt.sign({ id:pswd}, config.secret, {
						expiresIn: 86400 // expires in 24 hours	
					});
					
					rest.restaurant_token=token;
					
					for(var i=0;i<rest.menu_id.length;i++){
						console.log(i);
						rest.menu_id.add(rest.menu_id[i].menu_id);
					}
					for(var j=0;j<rest.order_to_retaurant_Fk.length;j++){
						console.log(j);
						rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[j].order_id);
						console.log(j);
					}
					rest.save();								
					res.status(200).json({ auth: true, token: token, restaurant });
				
				});
	});

	
	//ADD MENU
	routerUser.route("/add/menu")
	.post(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
	
		db("menus").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"Menu Added.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable To Add Menu.", err });	
			}
		
		});
	});
	//GET LIST OF MENUS
	routerUser.route("/get/menus/:id")
	.get(function (req,res){
		
		db("menus").find({"restaurant_id":req.params.id})
		//.populate("fooditem_to_menu_Fk")
		.exec(function(err,menus){
			res.status(200).json({menus});	
		});
	});
	
	//REMOVE MENUS
	routerUser.route("/delete/menu/:id")
	.get(function(req,res){
		db("menus").destroy({menu_id:req.params.id}).exec(function(err,menu){
			res.status(200).json({message:"Menu Deleted"});
		});
	});
	
	//ADD MENUITEM
	routerUser.route("/add/menuitem")
	.post(function(req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		db("fooditems").create(req.body.data).exec(function(err,record){
			if(!err)
			{
				res.status(200).json({ message:"MenuItem Added.", record });	
			}
			if(err)
			{
				res.status(404).json({ message:"Unable To Add MenuItem.", err });	
			}
		
		});
	});
	//GET LIST OF MENUITEMS
	routerUser.route("/get/menuitems/:id")
	.get(function (req,res){
		db("menus").find({menu_id:req.params.id})
		.populate("fooditem_to_menu_Fk")
		.exec(function(err,menuitems){
			res.status(200).json({menuitems});	
		});
	});
	
	//REMOVE MENUITEMS
	routerUser.route("/del/menuitem/:id")
	.get(function(req,res){
		db("fooditems").destroy({item_id:req.params.id}).exec(function(err,menuitem){
			res.status(200).json({message:"MenuItem Deleted"});
		});
	});
	
	
	//GET ALL ORDERS(for RESTAURANT)
	routerUser.route("/restaurant/orders/:id")
	.post(function (req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="A";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response=[];	
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										
										if(order.restaurant_id==req.params.id)
										{
											
											response.push(order);
											
										}
									
									});
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								if(response.length>0)
									return res.status(200).json({response});
									return res.status(404).json({message:'No Record Found.'});
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	//GET SINGLE ORDER DETAIL(for RESTAURANT)
	routerUser.route("/restaurant/order/:order_id")
	.post(function (req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="A";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response=[];	
							new Promise(function(resolve, reject) {
								db("orders").findOne({"order_id":req.params.order_id})
								.populate("user_id")
								.populate("fooditem_to_order_Fk")
								.exec(function(err,order){
										response.push(order);	
								
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								//console.log(response.length);
								if(response.length>0)
									return res.status(200).json({response});
									return res.status(404).json({message:'No Record Found.'});
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET TODAY ORDERS DETAIL(for RESTAURANT)
	routerUser.route("/restaurant/today/orders/detail/:id")
	.post(function (req,res){
		
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE5MzA4NzMxLCJleHAiOjE1MTkzOTUxMzF9.ug7atuZvP73wqmTb9YQO4NAI53BbOcSL-xuJ--FOPbs";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response=[];	
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {

										if(order.restaurant_id==req.params.id)
										{
											//console.log(order);
											var ordrDlvrdAt=new Date(order.order_delivered_at);
											var dbday = ordrDlvrdAt.getDate();
											var dbmonth = ordrDlvrdAt.getMonth();
											var dbyear = ordrDlvrdAt.getFullYear();
											

											var reqdatetime=new Date(req.body.data.data);
											var reqday=reqdatetime.getDate();
											var reqmonth=reqdatetime.getMonth();
											var reqyear=reqdatetime.getFullYear();
											
											//console.log(reqday);
											//console.log(dbday);
											if(reqday==dbday && dbmonth==reqmonth && dbyear==reqyear)
											{
												//console.log(order.rider_id+"is equal"+req.params.id);
												response.push(order);
											}
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								//console.log(response.length);
								if(response.length>0)
									return res.status(200).json({response});
									return res.status(404).json({message:'No Record Found.'});
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET ORDERS DETAIL(for restaurant)
	routerUser.route("/restaurant/week/orders/detail/:id")
	.post(function (req,res){
		
		
	//check body
		if(typeof req.body.dataWeek=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.dataWeek.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response=[];	
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										if(order.restaurant_id==req.params.id)
										{
											var arr=[];
											var reqdatetime=new Date(req.body.dataWeek.data);
											
											
											var dbdatetime=new Date(order.order_delivered_at);
											var dbday=dbdatetime.getDate();
											var dbmonth=dbdatetime.getMonth();
											var dbyear=dbdatetime.getFullYear();
												
											for(var i=1;i<=7;i++)
											{
												arr[i-1]=reqdatetime;
												
												/*console.log(arr[i-1].getDate()+"arr date");
												console.log(dbday+"db date");
												console.log(arr[i-1].getMonth()+"arr month");
												console.log(dbmonth+"db month");
												console.log(arr[i-1].getFullYear()+"arr year");
												console.log(dbyear+"db year");
												*/
												console.log("_________________");
												console.log(req.body.dataWeek.data);
												
																		
												if(arr[i-1].getDate()==dbday && arr[i-1].getMonth()==dbmonth && arr[i-1].getFullYear()==dbyear)
												{
													console.log(order.rider_id+"is equal"+req.params.id);
													response.push(order);
													break;
												}
												reqdatetime.setDate(reqdatetime.getDate()-1);
											
											}
											
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								if(response.length>0)
								return res.status(200).send({response});
								return res.status(404).send({message:"No record found."});
							
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET ORDERS DETAIL(for restaurant)
	routerUser.route("/restaurant/month/orders/detail/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var week1=[];	
							var week2=[];	
							var week3=[];	
							var week4=[];	
							var week5=[];	
					
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										//console.log(order);
										if(order.restaurant_id==req.params.id)
										{
											var arr=[];
											var reqdatetime=new Date(req.body.data.data);
											//var reqdate=reqdatetime.getDate();
											var reqmonth=reqdatetime.getMonth();
											var reqyear=reqdatetime.getFullYear();
											
											
											var dbdatetime=new Date(order.order_delivered_at);
											var dbday=dbdatetime.getDate();
											var dbmonth=dbdatetime.getMonth();
											var dbyear=dbdatetime.getFullYear();
											
													
											if(dbmonth==reqmonth && dbyear==reqyear)
											{
												if(dbday<=7)
													week1.push(order);
												if(dbday>7 && dbday<=14)
													week2.push(order);
												if(dbday>14 && dbday<=21)
													week3.push(order);
												if(dbday>21 && dbday<=28)
													week4.push(order);
												if(dbday>28 && dbday<=31)
													week5.push(order);
											
											}		
																						
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								if(week1.length>0 || week2.length>0 || week3.length>0 || week4.length>0 || week5.length>0)
									return res.status(200).send({week1,week2,week3,week4,week5});
								return res.status(404).send({message:"No record found."});
							
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	
	//GET REJECTED ORDERS DETAIL(for RESTAURANT)
	routerUser.route("/restaurant/today/rejected/orders/detail/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined'  || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE5MzA4NzMxLCJleHAiOjE1MTkzOTUxMzF9.ug7atuZvP73wqmTb9YQO4NAI53BbOcSL-xuJ--FOPbs";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response=[];	
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {

										if(order.restaurant_id==req.params.id && order.restaurant_status=="Rejected")
										{
											//console.log(order);
											var placedAt=new Date(order.order_placed_at);
											var dbday = placedAt.getDate();
											var dbmonth = placedAt.getMonth();
											var dbyear = placedAt.getFullYear();
											

											var reqdatetime=new Date(req.body.data.data);
											var reqday=reqdatetime.getDate();
											var reqmonth=reqdatetime.getMonth();
											var reqyear=reqdatetime.getFullYear();
											
											//console.log(reqday);
											//console.log(dbday);
											if(reqday==dbday && dbmonth==reqmonth && dbyear==reqyear)
											{
												//console.log(order.rider_id+"is equal"+req.params.id);
												response.push(order);
											}
										}
									
									});
								});
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								//console.log(response.length);
								if(response.length>0)
									return res.status(200).json({response});
									return res.status(404).json({message:'No Record Found.'});
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET WEEK REJECTED ORDERS DETAIL(for restaurant)
	routerUser.route("/restaurant/week/rejected/orders/detail/:id")
	.post(function (req,res){
		
		
	//check body
		if(typeof req.body.dataWeek=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.dataWeek.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response=[];	
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										
										if(order.restaurant_id==req.params.id && order.restaurant_status=="Rejected")
										{
											var arr=[];
											var reqdatetime=new Date(req.body.dataWeek.data);
											
											var dbdatetime=new Date(order.order_placed_at);
											var dbday=dbdatetime.getDate();
											var dbmonth=dbdatetime.getMonth();
											var dbyear=dbdatetime.getFullYear();
												
											for(var i=1;i<=7;i++)
											{
												arr[i-1]=reqdatetime;
												
												/*console.log(arr[i-1].getDate()+"arr date");
												console.log(dbday+"db date");
												console.log(arr[i-1].getMonth()+"arr month");
												console.log(dbmonth+"db month");
												console.log(arr[i-1].getFullYear()+"arr year");
												console.log(dbyear+"db year");
												*/
												console.log("_________________");
												console.log(req.body.dataWeek.data);
												
																		
												if(arr[i-1].getDate()==dbday && arr[i-1].getMonth()==dbmonth && arr[i-1].getFullYear()==dbyear)
												{
													console.log(order.rider_id+"is equal"+req.params.id);
													response.push(order);
													break;
												}
												reqdatetime.setDate(reqdatetime.getDate()-1);
											
											}
											
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								if(response.length>0)
								return res.status(200).send({response});
								return res.status(404).send({message:"No record found."});
							
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	//GET MONTH REJECTED ORDERS DETAIL(for restaurant)
	routerUser.route("/restaurant/month/rejected/orders/detail/:id")
	.post(function (req,res){
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.data=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
		
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var week1=[];	
							var week2=[];	
							var week3=[];	
							var week4=[];	
							var week5=[];	
					
							new Promise(function(resolve, reject) {
								db("orders").find().exec(function(err,orders){
									orders.forEach(function(order) {
										//console.log(order);
										if(order.restaurant_id==req.params.id && order.restaurant_status=="Rejected")
										{
											
											var arr=[];
											var reqdatetime=new Date(req.body.data.data);
											//var reqdate=reqdatetime.getDate();
											var reqmonth=reqdatetime.getMonth();
											var reqyear=reqdatetime.getFullYear();
											
											
											var dbdatetime=new Date(order.order_placed_at);
											var dbday=dbdatetime.getDate();
											var dbmonth=dbdatetime.getMonth();
											var dbyear=dbdatetime.getFullYear();
												
											if(dbmonth==reqmonth && dbyear==reqyear)
											{
												
												if(dbday<=7)
													week1.push(order);
												if(dbday>7 && dbday<=14)
													week2.push(order);
												if(dbday>14 && dbday<=21)
													week3.push(order);
												if(dbday>21 && dbday<=28)
													week4.push(order);
												if(dbday>28 && dbday<=31)
													week5.push(order);
											
											}		
																						
										}
									
									});
								});
								setTimeout(() => resolve(1), 500);
							}).then(function() {
								if(week1.length>0 || week2.length>0 || week3.length>0 || week4.length>0 || week5.length>0)
									return res.status(200).send({week1,week2,week3,week4,week5});
								return res.status(404).send({message:"No record found."});
							
							});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});		
		});	
	});
	
	
//ACCEPT OR REJECT ORDER (RESTAURANT)
	routerUser.route("/restaurant/order/status/:order_id")
	.put(function(req,res){
		
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.order_status=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		//var token=req.body.token;
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDM2MDMyMiwiZXhwIjoxNTIwNDQ2NzIyfQ.z6Cm-QgUqfQTBYjHnelNnp1ba_Q0TJI4Po1obXe5LrI";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("orders").findOne({"order_id":req.params.order_id})
								.populate("user_id")
								//.populate("fooditem_to_order_Fk")
								.exec(function (err,order){	
									var asgnAt=new Date();	
									order.restaurant_status=req.body.data.order_status;	
									/*for(var a=0;a<order.fooditem_to_order_Fk.length;a++){
										order.fooditem_to_order_Fk.add(order.fooditem_to_order_Fk[a].item_id);
									}*/
									order.save();
									response=order;
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Order Accepted.',response });
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////functions/////////////////////////////////////////////
//////////////////////////////////////////////////////////
function notify_user_on_restaurant_quit_order(orderid){


		/*	console.log("------------------notify_user_on_order_action-----------------------");
			console.log("--------------------orderid---------------------"+orderid);
			console.log("--------------------restStatus---------------------"+restStatus);
			console.log("-------------------notify_user_on_order_action----------------------");*/
var serverKey = 'AIzaSyCnYp4M3-dUo9ORAi4uTA-forhmR0T7HBY';
		var UserFcm = new FCM(serverKey);
			db("orders").findOne({"order_id":orderid})
			
				.exec(function (err,order){
					if (!order) return res.status(404).json({message:"There was a problem finding the order."});
			
		db("users").findOne({"user_id":order.user_id})
			
				.exec(function (err,user){
					if (!user) return res.status(404).json({message:"There was a problem finding the order."});
			


				var message = {
				to:user.user_firebase_token, // required fill with device token or topics
				
				collapse_key: 'your_collapse_key', 
				data: {
					
					//order_id: req.params.order_id
				},
				notification: {
					title: 'Notification',
					body: 'Your order is  Rejected'
				}
			};

			UserFcm.send(message, function(err, response){
			if (err) {
				console.log("------------------notify_user_on_order_action-----------------------");
			console.log("------------------errror-----------------------");
			console.log("-------------------notify_user_on_order_action----------------------");
				
					console.log("Something has gone wrong!"+err);
				} else {

						console.log("------------------notify_user_on_order_action-----------------------");
			console.log("------------------succes-----------------------");
			console.log("-------------------notify_restaurant_on_new_order----------------------");
					console.log("Successfully sent with notify_user_on_order_action: ", response);
				}
			});
			

			/*console.log("------------------notify_user_on_order_action-----------------------");
			console.log("--------------------user_id---------------------"+user.user_firebase_token);
		
			console.log("-------------------notify_user_on_order_action----------------------");
			*/

				
		});
			
			

				
		});

}

function notify_user_on_restaurant_busy(dtime,orderid){


		/*	console.log("------------------notify_user_on_order_action-----------------------");
			console.log("--------------------orderid---------------------"+orderid);
			console.log("--------------------restStatus---------------------"+restStatus);
			console.log("-------------------notify_user_on_order_action----------------------");*/
var serverKey = 'AIzaSyCnYp4M3-dUo9ORAi4uTA-forhmR0T7HBY';
		var UserFcm = new FCM(serverKey);
			db("orders").findOne({"order_id":orderid})
			
				.exec(function (err,order){
					if (!order) return res.status(404).json({message:"There was a problem finding the order."});
			
		db("users").findOne({"user_id":order.user_id})
			
				.exec(function (err,user){
					if (!user) return res.status(404).json({message:"There was a problem finding the order."});
			


				var message = {
				to:user.user_firebase_token, // required fill with device token or topics
				
				collapse_key: 'your_collapse_key', 
				data: {
					
					//order_id: req.params.order_id
				},
				notification: {
					title: 'Notification',
					body: 'your order is delay of '+dtime+' Minutes'
				}
			};

			UserFcm.send(message, function(err, response){
			if (err) {
				console.log("------------------notify_user_on_order_action-----------------------");
			console.log("------------------errror-----------------------");
			console.log("-------------------notify_user_on_order_action----------------------");
				
					console.log("Something has gone wrong!"+err);
				} else {

						console.log("------------------notify_user_on_order_action-----------------------");
			console.log("------------------succes-----------------------");
			console.log("-------------------notify_restaurant_on_new_order----------------------");
					console.log("Successfully sent with notify_user_on_order_action: ", response);
				}
			});
			

			/*console.log("------------------notify_user_on_order_action-----------------------");
			console.log("--------------------user_id---------------------"+user.user_firebase_token);
		
			console.log("-------------------notify_user_on_order_action----------------------");
			*/

				
		});
			
			

				
		});

}

	//MARK ORDER moderate_quit (RESTAURANT)
	routerUser.route("/restaurant/order/moderate_quit/:order_id")
	.put(function(req,res){
		
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.rest_status=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		//var token=req.body.token;
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMCIsImlhdCI6MTUyMTEzODg5OSwiZXhwIjoxNTIxMjI1Mjk5fQ.i36iOkDm7Jst9Pvbpw_2BtkeGwx3Ot51cSBVKqoocQ0";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("orders").findOne({"order_id":req.params.order_id})
								.populate("user_id")
								//.populate("fooditem_to_order_Fk")
								.exec(function (err,order){	
									var asgnAt=new Date();	
									//order.delivery_time=req.body.data.time;	
									order.restaurant_status=req.body.data.rest_status;
										if(req.body.data.rest_status=="Quiet"){
											order.order_status="Rejected";
											notify_user_on_restaurant_quit_order(req.params.order_id);

										}
										
									/*for(var a=0;a<order.fooditem_to_order_Fk.length;a++){
										order.fooditem_to_order_Fk.add(order.fooditem_to_order_Fk[a].item_id);
									}*/
									order.save();
									response=order;
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Order Accepted.',response });
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});

	
//MARK ORDER BUSY (RESTAURANT)
	routerUser.route("/restaurant/order/busy/:order_id")
	.put(function(req,res){
		
		
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.time=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		//var token=req.body.token;
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDM2MDMyMiwiZXhwIjoxNTIwNDQ2NzIyfQ.z6Cm-QgUqfQTBYjHnelNnp1ba_Q0TJI4Po1obXe5LrI";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								db("orders").findOne({"order_id":req.params.order_id})
								.populate("user_id")
								//.populate("fooditem_to_order_Fk")
								.exec(function (err,order){	
									var asgnAt=new Date();	
									order.delivery_time=req.body.data.time;	
									order.restaurant_status="Busy";	
									/*for(var a=0;a<order.fooditem_to_order_Fk.length;a++){
										order.fooditem_to_order_Fk.add(order.fooditem_to_order_Fk[a].item_id);
									}*/
									notify_user_on_restaurant_busy(req.body.data.time,req.params.order_id);
									order.save();
									response=order;
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Order Accepted.',response });
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
//CHANGE RESTAURANT STATUS (RESTAURANT)
	routerUser.route("/restaurant/status/:id")
	.put(function(req,res){
	
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.rest_status=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDM2MDMyMiwiZXhwIjoxNTIwNDQ2NzIyfQ.z6Cm-QgUqfQTBYjHnelNnp1ba_Q0TJI4Po1obXe5LrI";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token && rests[i].restaurant_id==req.params.id)
						{
							new Promise(function(resolve, reject) {
								db("restaurants").findOne({"restaurant_id":req.params.id})
								.populate("menu_id")
								.populate("order_to_retaurant_Fk")
								.exec(function(err,rest)
								{
									if(rest){
										rest.restaurant_status=req.body.data.rest_status;
										if(typeof req.body.data.delivery_time!=='undefined')
										{
											rest.restaurant_delievery_time=req.body.data.delivery_time;
										}
										for(var a=0;a<rest.menu_id.length;a++){
											rest.menu_id.add(rest.menu_id[a].menu_id);
										}
										for(var b=0;b<rest.order_to_retaurant_Fk.length;b++){
											rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[b].order_id);
										}
										rest.save();
									}
									else{
										return res.status(404).send({message: 'No Record Found.'});
									}
										
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									return res.status(200).send({message: 'Status Updated.'});
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
//CHANGE RESTAURANT OPENING AND CLOSING TIME (RESTAURANT)
	routerUser.route("/restaurant/time/change/:id")
	.put(function(req,res){
	
	//check body

		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.open_time=='undefined' || typeof req.body.data.close_time=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDM2MDMyMiwiZXhwIjoxNTIwNDQ2NzIyfQ.z6Cm-QgUqfQTBYjHnelNnp1ba_Q0TJI4Po1obXe5LrI";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token && rests[i].restaurant_id==req.params.id)
						{
							new Promise(function(resolve, reject) {
								db("restaurants").findOne({"restaurant_id":req.params.id})
								.populate("menu_id")
								.populate("order_to_retaurant_Fk")
								.exec(function(err,rest)
								{
									if(rest){
										rest.restaurant_opening_time=req.body.data.open_time;
										rest.restaurant_closing_time=req.body.data.close_time;
										for(var a=0;a<rest.menu_id.length;a++){
											rest.menu_id.add(rest.menu_id[a].menu_id);
										}
										for(var b=0;b<rest.order_to_retaurant_Fk.length;b++){
											rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[b].order_id);
										}
										rest.save();
									}
									else{
										return res.status(404).send({message: 'No Record Found.'});
									}
										
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									return res.status(200).send({message: 'Timings Updated.'});
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});

	//CHANGE PASSWORD RESTAURANT
	routerUser.route("/change/restaurant/password/:id")
	.put(function(req,res){	
	
	console.log("SDsada");
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.curr_password=='undefined' || typeof req.body.data.new_password=='undefined'
			|| typeof req.body.data.rest_email=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var curr_password=req.body.data.curr_password;
		var new_password=req.body.data.new_password;
		var rest_email=req.body.data.rest_email;
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTUyMDUxOTIyNywiZXhwIjoxNTIwNjA1NjI3fQ.j5TKv7DGvPZkGFKfdEjicKJmeihKypQrc-3wvgSCF5c";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
			db("restaurants").find().exec(function(err,rests){
				if(rests)
				{
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							db("restaurants").findOne({"restaurant_email":rest_email,"restaurant_password":curr_password})
							.populate("menu_id")
							.populate("order_to_retaurant_Fk")
							.exec(function(err,rest)
							{
								if(rest){
									rest.restaurant_password=new_password;	
									
										var mailOptions = {
										  from: '13151556-026@uog.edu.pk',
										  to: rest_email,
										  subject: "subject",
										  text: "Your Password has been changed!"
										};

										transporter.sendMail(mailOptions, function(error, info){
										  if (error) {
											console.log(error);
										  } else {
											console.log('Email sent: ' + info.response);
											return res.send('Email sent: ' + info.response);
										  }
										});
										for(var a=0;a<rest.menu_id.length;a++){
											rest.menu_id.add(rest.menu_id[a].menu_id);
										}
										for(var b=0;b<rest.order_to_retaurant_Fk.length;b++){
											rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[b].order_id);
										}
										rest.save();
										
										
										return res.status(200).send({message: 'Password Changed!'});
													
									}
									else{
										return res.status(404).send({message: 'No Record With This Email Exist!'});
									}
							});	
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				}
				else
					return res.status(404).send({message: 'No Record With This Email Exist!'});
			});	
		});				
				
	});

	
	//FORGET PASSWORD RESTAURANT
	routerUser.route("/forget/restaurant/password")
	.put(function(req,res){
	
				console.log("called");
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
			
		if(typeof req.body.data.restaurant_email=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
			
		var rest_email=req.body.data.restaurant_email;
				
		db("restaurants").findOne({"restaurant_email":rest_email})
				.populate("menu_id")
				.populate("order_to_retaurant_Fk")
				.exec(function(err,rest)
				{

				if(rest){
						var code =randomize('0,A', 8);
							rest.restaurant_password=code;	
							
								var mailOptions = {
								  from: '13151556-026@uog.edu.pk',
								  to: req.body.data.restaurant_email,
								  subject: "subject",
								  text: "Your New Password is :"+code+ " kindly change it at your first login!"
								};

								transporter.sendMail(mailOptions, function(error, info){
								  if (error) {
									console.log(error);
								  } else {
									console.log('Email sent: ' + info.response);
									return res.send('Email sent: ' + info.response);
								  }
								});
								for(var a=0;a<rest.menu_id.length;a++){
									rest.menu_id.add(rest.menu_id[a].menu_id);
								}
								for(var b=0;b<rest.order_to_retaurant_Fk.length;b++){
									rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[b].order_id);
								}
								rest.save();
								
								
									return res.status(200).send({message: 'Password Changed!'});
								
					}
					else{
						return res.status(404).send({message: 'No Record With This Email Exist!'});
					}
				});
	});
	
	
	
	
//RESTAURANT SETTINGS
	routerUser.route("/restaurant/setting/:id")
	.put(function(req,res){
		
	//check body		
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		if(typeof req.body.data.rest_name=='undefined' || typeof req.body.data.rest_address=='undefined'
			|| typeof req.body.data.rest_delievery_time=='undefined' || typeof req.body.data.rest_postal_code=='undefined'
			|| typeof req.body.data.rest_contact=='undefined' || typeof req.body.data.rest_phone=='undefined')
		{
			return res.status(400).json({message:"Invalid Or Less Parameters Sent."});
		}
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		var token =JSON.parse(req.headers['token']);
		console.log(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							new Promise(function(resolve, reject) {
								db("restaurants").findOne({"restaurant_username":rests[i].restaurant_username,"restaurant_password":rests[i].restaurant_password})
								.populate("menu_id")
								.populate("order_to_retaurant_Fk")
								.exec(function (err,rest){	
									rest.restaurant_name=req.body.data.rest_name;
									rest.restaurant_address=req.body.data.rest_address;
									rest.restaurant_delievery_time=req.body.data.rest_delievery_time;
									rest.restaurant_postal_code=req.body.data.rest_postal_code;
									rest.restaurant_contect=req.body.data.rest_contact;
									rest.restaurant_phone_no=req.body.data.rest_phone;
									for(var i=0;i<rest.menu_id.length;i++){
										rest.menu_id.add(rest.menu_id[i].menu_id);
									}
									for(var j=0;j<rest.order_to_retaurant_Fk.length;j++){
										rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[j].order_id);
									}
									rest.save();								
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									return res.status(200).send({message: 'Restaurant Updated'});
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
	
	//RESTAURANT LOGOUT
	routerUser.route("/restaurant/logout")
	.put(function(req,res){
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		console.log(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyIiwiaWF0IjoxNTE3MzMxNjI0LCJleHAiOjE1MTc0MTgwMjR9.AJnIUHr_KZ8YyKBmXuHkm_uB7ccEVsVw1ihoBf7asnM";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,rests){
					for(i=0;i<rests.length;i++){
						if(rests[i].restaurant_token==token)
						{	
							new Promise(function(resolve, reject) {
								db("restaurants").findOne({"restaurant_username":rests[i].restaurant_username,"restaurant_password":rests[i].restaurant_password})
								.populate("menu_id")
								.populate("order_to_retaurant_Fk")
								.exec(function (err,rest){	
									rests.restaurant_token=token;
					
									for(var i=0;i<rest.menu_id.length;i++){
										console.log(i);
										rest.menu_id.add(rest.menu_id[i].menu_id);
									}
									for(var j=0;j<rest.order_to_retaurant_Fk.length;j++){
										console.log(j);
										rest.order_to_retaurant_Fk.add(rest.order_to_retaurant_Fk[j].order_id);
										console.log(j);
									}
									rest.save();								
								});		
								setTimeout(() => resolve(1), 100);
							}).then(function() {
									res.status(200).send({message: 'Logged Out'});
								});
							break;
						}
						else if((i==(rests.length-1)) && rests[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
	
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	

	
	
	
	
	
	
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//OTHER API'S
	
	
	//GET POSTALCODE FROM LAT/LAN
	
	routerUser.route("/get/postalcode/:lat/:lon")
	.get(function(req,res){
		
		var latitude=req.params.lat;;
		var longitude=req.params.lon;
		var start;
		//console.log(lat+"fs"+lan);
												
			geocoder.reverse({lat:latitude, lon:longitude}, function(err, resp) {
				if(err)
				{
					return res.status(404).send({ message: 'Invalid Lat/Lon' });
				}
				var address=resp[0].formattedAddress;
				var postalCode=resp[0].zipcode;
				
				res.status(200).json({  address,postalCode});	
			});	
		});
		
	//GET LAT/LAN FROM POSTALCODE
	
	routerUser.route("/get/latlon/:postalcode")
	.get(function(req,res){
		var postalCode=req.params.postalcode;		
		geocoder.geocode(postalCode)
		  .then(function(resp) {
			   console.log(resp);
			 if(resp.length>0)
			 {
				  var lat=resp[0].latitude;
				  var lon=resp[0].longitude;
				  
				  return res.status(200).json({lat,lon});	
			  }
			  else{
				  return res.status(404).send({ message: 'Invalid Postal Code.'});
			  }
			 
		  });
	});
		
	//MAIL API
	routerUser.route("/send/mail")
	.post(function(req,res){
		var mailOptions = {
		  from: '13151556-026@uog.edu.pk',
		  to: '13151556-106@uog.edu.pk',
		  subject: req.body.subject,
		  text: req.body.text
		};

		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
			console.log(error);
		  } else {
			console.log('Email sent: ' + info.response);
			return res.send('Email sent: ' + info.response);
		  }
		});
	});
/////////////////////////////////////////////////////////////////////////////////////////////




		
//FOR WEB		
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////		
		
//SEARCH RESTAURANTS BY POSTALCODE (FOR WEBSITE)
	routerUser.route("/search/restaurants/all/details")
	.post(function(req,res){
		
		if(typeof req.body.postalCode=='undefined')
		{
			return res.status(400).json({message:"Postal Code Not Defined."});
		}
		
		
		var origins = [req.body.postalCode];
		var destinations = [];
					var restRangeList=[];
					var menus;
					var index=0;
					new Promise(function(resolve, reject) {
						db("menus").find()
						.populate("fooditem_to_menu_Fk")
						.exec(function(err,men){
							menus=men;
						});
						db("restaurants").find().exec(function(err,rests){
							for(j=0;j<rests.length;j++){
								//destinations = ['New York NY', '41.8337329,-87.7321554']
								destinations.push(rests[j].restaurant_postal_code);
								
							if(j==(rests.length-1))
							{
								distancel.matrix(origins, destinations, function (err, distances) {							
									if (err) {
										return res.status(400).json({ message:"Error.",err});
									}
									if(!distances) {
										return res.status(404).json({ message:"No Distance Found."});
									}
									if (distances.status == 'OK') {
										for (var i=0; i < origins.length; i++) {
											for (var j = 0; j < destinations.length; j++) {
												var origin = distances.origin_addresses[i];
												var destination = distances.destination_addresses[j];
												if (distances.rows[0].elements[j].status == 'OK') {
													var distance = distances.rows[i].elements[j].distance.text;
													console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance);
													if(parseInt(distance)<= 2.5)
													{
														restRangeList.push(rests[j]);
													}
												} 
												else 
												{
													console.log(destination + ' is not reachable by land from ' + origin);
												}
											}
										}
									}
								});
							}
						}									
					});
					
						setTimeout(() => resolve(1), 3000);			
					}).then(function() {	
								if(restRangeList.length>0 && index==0)
								{
									index=1;
									return res.status(200).json({restRangeList,menus});
								}
								if(restRangeList.length<1 && index==0)
								{
									index=1;
									return res.status(404).json({ message:"No Record Found."});					
								}
							});
		});	


//GET ALL RESTAURANTS (FOR WEB)
	routerUser.route("/restaurant/getrestaurants/all/details")
	.post(function(req,res){
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		if(typeof req.body.data.lat=='undefined' || typeof req.body.data.lan=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
		var lat=req.body.data.lat;
		var lan=req.body.data.lan;
		
		var origins = [];
		var destinations = [];
		
		var restRangeList=[];
		var menus;
		var index=0;
		
		new Promise(function(resolve, reject) {
			geocoder.reverse({lat:lat, lon:lan}, function(err, res) {
				if(err)
				{
					return res.status(400).send({ message: 'Invalid Lat/Lon' });
				}
				origins.push(res[0].zipcode);
				console.log("origins");
				console.log(origins);
			});
			setTimeout(() => resolve(1), 1000);
							
		}).then(function() {
			new Promise(function(resolve, reject) {
				db("menus").find()
				.populate("fooditem_to_menu_Fk")
				.exec(function(err,men){
					menus=men;
				});
				db("restaurants").find().exec(function(err,rests){
					for(j=0;j<rests.length;j++){
						destinations.push(rests[j].restaurant_postal_code);							
							if(j==(rests.length-1))
							{
								distancel.matrix(origins, destinations, function (err, distances) {							
									if (err) {
										return res.status(400).json({ message:"Error.",err});
									}
									if(!distances) {
										return res.status(404).json({ message:"No Distance Found."});
									}
									if (distances.status == 'OK') {
										for (var i=0; i < origins.length; i++) {
											for (var j = 0; j < destinations.length; j++) {
												var origin = distances.origin_addresses[i];
												var destination = distances.destination_addresses[j];
												if (distances.rows[0].elements[j].status == 'OK') {
													var distance = distances.rows[i].elements[j].distance.text;
													console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance);
													if(parseInt(distance)<= 2.5)
													{
														restRangeList.push(rests[j]);
													}
												} 
												else 
												{
													console.log(destination + ' is not reachable by land from ' + origin);
												}
											}
										}
									}
								});
							}
						}									
				});										
					setTimeout(() => resolve(1), 3000);
										
				}).then(function() {
							if(restRangeList.length>0)
								return res.status(200).json({restRangeList,menus});
							return res.status(404).json({ message:"No Record Found."});

				});
									
								
								
			});			
		
	});
	//UPDATE FIREBASE TOKEN (restaurant)
	routerUser.route("/restaurant/update/firebase")
	.put(function(req,res){
	console.log("-----------------------------------");
		console.log(req.body.data);
			console.log("--------------------------");
	//check body
		if(typeof req.body.data=='undefined')
		{
			return res.status(400).json({message:"No Data Object Sent."});
		}
		
		if(typeof req.body.data.firebase_token=='undefined')
		{
			return res.status(400).json({message:"Incorrect/Less Than Required Parameters Sent."});
		}
		
	//check header
		if(typeof req.headers=='undefined')
		{
			return res.status(400).json({message:"No Header Attached."});
		}
		if(typeof req.headers['token']=='undefined' || req.headers['token'].length<3)
		{
			return res.status(400).json({message:"Token Not Sent In Header."});
		}
		
		var token =JSON.parse(req.headers['token']);
		//var token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE1MTYyNjAwNjQsImV4cCI6MTUxNjM0NjQ2NH0.xGlBQoDpUnLJ973_2od0AAvXwWVTLh_XQWH-YIU3GF4";
		if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
		jwt.verify(token, config.secret, function(err, decoded) {
			//if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
				//res.status(200).send(decoded);
				
				db("restaurants").find().exec(function(err,restaurants){
					for(i=0;i<restaurants.length;i++){
						if(restaurants[i].restaurant_token==token)
						{	
							var response;
							new Promise(function(resolve, reject) {
								//new added
								db("restaurants").findOne({"restaurant_id":restaurants[i].restaurant_id})
								.populate("menu_id")
								/*.populate("order_to_user_Fk")*/
								.exec(function (err,restaurant){
									restaurant.firebase_token=req.body.data.firebase_token;
									console.log("-----------------------------------");
									console.log(restaurant);
									console.log("--------------------------");								
									/*for(var i=0;i<user.locations_to_user_Fk.length;i++){
										user.locations_to_user_Fk.add(user.locations_to_user_Fk[i].user_postal_code);
									}
									for(var i=0;i<user.order_to_user_Fk.length;i++){
										user.order_to_user_Fk.add(user.order_to_user_Fk[i].order_id);
									}*/
									restaurant.save();					
									response=restaurant;
								});
								//new above
								/*db("restaurants").update("restaurant_id",restaurant_id).exec(function (err,rest){
									response=rest;
								});*/
								setTimeout(() => resolve(1), 100);
							}).then(function() {
								if(response)
									return res.status(200).send({message: 'User Updated.',response });
									//return res.status(404).send({message: 'No Record Found.'});
								});
							break;
						}
						else if((i==(restaurants.length-1)) && restaurants[i].restaurant_token!=token)
						{
							return res.status(404).send({ auth: false, message: 'Failed to authenticate token.' });
						}
					}
				});			
		});	
	});
	
/////////////////////////////////////////////////////////////////////////////////////////////


	
			
		

/////////////////////////////////////////////////////////////////////////////////////////////
	//POST ORDER USER CHECKING API  (for user)
	routerUser.route("/post/order/manytomany")
	.post(function(req,res){
		
		db("orderi").create(req.body).exec(function(err,record){
			if(!err)
			{	
				for(var i=0;i<req.body.quantity;i++)
				{
					db("ordersitems").create({"order":record.id,"fooditem":req.body.fid}).exec(function(error,third){
						if(!error && i==req.body.quantity-1)
						{
							return res.status(200).json({ message:"Order saved", third });	
						}
						if(error)
						{
							return res.status(404).json({ message:"Unable to save order", error });	
						}
					  
					});
				}
				
				return res.status(200).json({ message:"Order saved", record });	
			}
			if(err)
			{
				return res.status(404).json({ message:"Unable to save order", err });	
			}
		  
		});
	});

	//GET ORDERS DETAIL(for user)
	routerUser.route("/get/orderi/detail/:id")
	.get(function (req,res){
		var orderitem;
		var orderitemChkd;
		db("orderi").find(req.params.id)
		.populate("fooditem_Fk")
		.populate("restaurant_id")
		.exec(function(err,orders){			
			return res.status(200).send({orders});
			return res.status(404).send({message:"No Record Found."});
		});	
	});
//////////////////////////////////////////////////////////////New rejects Api//////////////////////

	
module.exports=routerUser;