'use strict';

// Weather Example
// See https://wit.ai/sungkim/weather/stories and https://wit.ai/docs/quickstart
const Wit = require('node-wit').Wit;
const FB = require('./facebook.js');
const Config = require('./const.js');
var fetch = require('node-fetch'); // fetch muss zunächst installiert werden npm install node-fetch --save. nach der einbindung in package.json kann diese hier eingebunden werden

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

// Bot actions
const actions = {
  say(sessionId, context, message, cb) {
    console.log(message);

    // Bot testing mode, run cb() and return
    if (require.main === module) {
      cb();
      return;
    }

    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to from context
    // TODO: need to get Facebook user name
    const recipientId = context._fbid_;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      FB.fbMessage(recipientId, message, (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        // Let's give the wheel back to our bot
        cb();
      });
    } else {
      console.log('Oops! Couldn\'t find user in context:', context);
      // Giving the wheel back to our bot
      cb();
    }
  },
  
  ['getForecast'](context,entities, cb) {  
	  console.log("Medthode:getforecast");
	var location = context.location;
	   console.log("location",location);
	  if (location) {
		   console.log("merge nicht ausgeführt, versuche location aus entity zu holen");
		location = firstEntityValue(entities, "location");
	  }
	     //var location = firstEntityValue(entities, "location");
	    console.log("location",location);
	if (location) {
		 console.log("location gesetzt");
			var wetter_aktuell = "http://api.openweathermap.org/data/2.5/weather?q=" + location + "&APPID=bee2a155f8da9fb44104d360cc2feb8f&units=metric";
			var wetter_vorhersage = "http://api.openweathermap.org/data/2.5/forecast?q="+location +"&APPID=bee2a155f8da9fb44104d360cc2feb8f&units=metric";
			console.log("wetter_aktuell",wetter_aktuell);
			fetch(wetter_aktuell).then(function(res) 
			{ 
				return res.json(); 
			}).then(function(json) {
				
				//auslesen des ergebnisses
				var temperatur = json.main.temp; 
				var vorhersage = json.weather.main;
				var vorhersage2 = json.weather.description;
				var temp_min = json.main.temp_min;
				var temp_max = json.main.temp_max;

				context.forecast = temperatur;
				 console.log("temperatur",temperatur);
				delete context.missingLocation;
			});
    } else {
	     console.log("else zweig");
      context.missingLocation = true;
      delete context.forecast;
    }
			cb(context);
  },  

 merge(sessionId, context, entities, message, cb) {
	 console.log("merge");
    // Retrieve the location entity and store it into a context field
    const loc = firstEntityValue(entities, 'location');
    if (loc) {
	    	 console.log("merge, Location",loc);
      context.location = loc; // store it in context
	    console.log("merge, Location",context.location);
    }

    cb(context);
  },


  error(sessionId, context, error) {
    console.log(error.message);
  },

};


const getWit = () => {
  return new Wit(Config.WIT_TOKEN, actions);
};

exports.getWit = getWit;

// bot testing mode
// http://stackoverflow.com/questions/6398196
if (require.main === module) {
  console.log("Bot testing mode.");
  const client = getWit();
  client.interactive();
}
