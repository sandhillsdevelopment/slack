#!/usr/bin/env node
var Client  = require('slack-client'),
    request = require('request');

module.exports = Client;
 
// Create a new bot at https://YOURSLACK.slack.com/services/new/bot
var BOT_TOKEN = 'xoxb-215585930114-ndEzrGimPtXheUbyZ5pUgrHa';

var slack = new Client(BOT_TOKEN, true, true);

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
    var repo = getRepoFromChannel( channel.name );

    // if we find a #...
    if (message.type === 'message' && message.hasOwnProperty('text') && message.text.indexOf('#') > -1) {
      var issueNum = message.text.substr(message.text.indexOf('#')).split(' ')[0];
      if (/^#\d+$/.test(issueNum)) {
        var issueDescription,
            options = {
              url: 'https://api.github.com/repos/' + repo + '/issues/' + issueNum.substr(1),
              method: 'GET',
              headers: {
                'User-Agent':   'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            };

        //Github API requires User Agent
        request(options, function (error, response, body) {
          var json = JSON.parse(body);
          if (!error && response.statusCode == 200) {
            issueDescription = "[#" + json.number + "] " + json.title + "\n " + json.html_url;
            channel.send(issueDescription)
          }
        });
      }
    }
});

function getRepoFromChannel( channel ) {
	var $repo;

	switch( channel ) {
		case 'affwp-general':
		case 'affwp-docs':
		case 'affwp-support':
			$repo = 'AffiliateWP/AffiliateWP';
			break;

		case 'edd-general':
		case 'edd-docs':
		case 'edd-support':
			$repo = 'easydigitaldownloads/easy-digital-downloads';
			break;

		case 'rcp-general':
		case 'rcp-support':
			$repo = 'restrictcontentpro/restrict-content-pro';
			break;
	}

	return $repo;
}

slack.login();