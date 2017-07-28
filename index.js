#!/usr/bin/env node
var Client   = require('slack-client'),
    request  = require('request'),
    maps     = require('./repo-maps.js');

module.exports = Client;

// Instantiate maps().
var repoMaps = new maps();

var slack = new Client(repoMaps.bot_token, true, true);

slack.on('open', function () {
	var channels = Object.keys(slack.channels)
		.map(function (k) { return slack.channels[k]; })
		.filter(function (c) { return c.is_member; })
		.map(function (c) { return c.name; });

	var groups = Object.keys(slack.groups)
		.map(function (k) { return slack.groups[k]; })
		.filter(function (g) { return g.is_open && !g.is_archived; })
		.map(function (g) { return g.name; });

	console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);

	if (channels.length > 0) {
		console.log('You are in: ' + channels.join(', '));
	}
	else {
		console.log('You are not in any channels.');
	}

	if (groups.length > 0) {
		console.log('As well as: ' + groups.join(', '));
	}
});

// when someone posts to the channel
slack.on('message', function(message) {
	var channel = slack.getChannelGroupOrDMByID(message.channel);
	var user = slack.getUserByID(message.user);
	var repo = repoMaps.getByChannel( channel.name );

	if (message.type === 'message' && message.hasOwnProperty('text') ) {

		var issueFound = message.text.match( /#([a-z]+)?\\d+/ );

		// if we find a #:
		if ( null !== issueFound ) {

			var issueNum = issueFound[0];
			var abbr     = issueNum.match( /[a-z]+/ );

			console.log(abbr);
			if ( null !== abbr ) {
				repo = repoMaps.getByAbbr( abbr[0], channel.name );

				// Rewrite the issueNum minus the abbreviation.
				issueNum = '#' + issueNum.match(/\d+$/);
			}

			console.log(repo);
			console.log(issueNum);

			if (/^#\d+$/.test(issueNum)) {
				var issueDescription,
					token = repoMaps.auth_token,
					options = {
						url: 'https://api.github.com/repos/' + repo + '/issues/' + issueNum.substr(1),
						method: 'GET',
						headers: {
							'User-Agent':   'Super Agent/0.0.1',
							'Content-Type': 'application/x-www-form-urlencoded',
							'Authorization': 'token ' + token
						}
					};

				//Github API requires User Agent
				request(options, function (error, response, body) {
					var json = JSON.parse(body);
					if (!error && response.statusCode == 200) {
						issueDescription = "*" + repo + "*\n";
						issueDescription += "[#" + json.number + "] " + json.title + "\n " + json.html_url;
						channel.send(issueDescription)
					} else {
						console.log( error );
					}

					// console.log( response.headers );
				});
			}

		// If we get '@github list':
		} else if ( message.text.match( /^\<@U6BH7TC3C\>\slist$/ ) ) {

			var mapObject = repoMaps.getMapObject( channel.name );

			if ( null !== mapObject ) {

				channel.send( "*Repo Abbreviation Map:*\n" + "```" + JSON.stringify( mapObject, null, 4 ) + "```" );

			} else {

				console.log( "Nothing to print." );

			}


		}

	}
});

slack.login();