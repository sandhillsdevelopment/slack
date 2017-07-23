#!/usr/bin/env node
var Client  = require('slack-client'),
    request = require('request');
    fs      = require('fs');

module.exports = Client;
 
// Create a new bot at https://YOURSLACK.slack.com/services/new/bot
var BOT_TOKEN = 'xoxb-215585930114-ndEzrGimPtXheUbyZ5pUgrHa',
    AUTH_TOKEN = fs.readFileSync( 'secrets' );

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
    var	channel = slack.getChannelGroupOrDMByID(message.channel),
		user = slack.getUserByID(message.user),
		repo = getRepoFromChannel( channel.name ),
		issuesURL;

    // if we find a #...
    if (message.type === 'message' && message.hasOwnProperty('text') && message.text.indexOf('#') > -1) {
      var issueNum = message.text.substr(message.text.indexOf('#')).split(' ')[0];
      var abbr     = issueNum.match( /[a-z]+/ );

      console.log('Detected');
      console.log(abbr);

      if ( null !== abbr ) {
		  repo = getRepoFromAbbr( abbr[0], channel.name );

		  // Rewrite the issueNum minus the abbreviation.
		  issueNum = '#' + issueNum.match(/\d+$/);
      }

      console.log(repo);
      console.log(issueNum);

      if (/^#\d+$/.test(issueNum)) {
        var issueDescription,
            issuesURL = 'https://api.github.com/repos/' + repo + '/issues/' + issueNum.substr(1),
            options = {
              url: issuesURL,
              method: 'GET',
              headers: {
                'User-Agent':   'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': "Basic " + $.base64.encode( "DrewAPicture:" + AUTH_TOKEN.toString() );
              }
            };

        console.log( 'Repo URL:' );
        console.log( options.url );

        console.log( options );
        //Github API requires User Agent
        request(options, function (error, response, body) {
          var json = JSON.parse(body);
          if (!error && response.statusCode == 200) {
            issueDescription = "[#" + json.number + "] " + json.title + "\n " + json.html_url;

            console.log( 'Response' );
            console.log( issueDescription );
            channel.send(issueDescription)
          } else {
			console.log( 'Request error' );
			console.log( issuesURL );

			// Send the link anyway.
			channel.send( issuesURL );
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

/**
 * Retrieves a repo by abbreviation and channel.
 *
 * @param {string} abbr    Repo abbreviation.
 * @param {string} channel Channel name
 * @returns {string} Repo.
 */
function getRepoFromAbbr( abbr, channel ) {

	var $repo;

	switch( channel ) {
		case 'affwp-general':
		case 'affwp-docs':
		case 'affwp-support':
			if ( 'undefined' !== AffWPRepoMap[abbr] ) {
				$repo = "AffiliateWP/" + AffWPRepoMap[abbr];
			}
			break;

		case 'edd-general':
		case 'edd-docs':
		case 'edd-support':
			if ( 'undefined' !== EDDRepoMap[abbr] ) {
				$repo = "easydigitaldownloads/" + EDDRepoMap[abbr];
			}
			break;

		case 'rcp-general':
		case 'rcp-support':
			if ( 'undefined' !== RCPRepoMap[abbr] ) {
				$repo = "restrictcontentpro/" + RCPRepoMap[abbr];
			}
			break;
	}

	return $repo;
}

var AffWPRepoMap = {
	allow:  'affiliatewp-allow-own-referrals',
	ap:     'affiliatewp-allowed-products',
	apr:    'affiliatewp-affiliate-product-rates',
	arl:    'affiliatewp-add-referral-links',
	cas:    'affiliatewp-custom-affiliate-slugs',
	cligen: 'affiliatewp-wp-cli-generator',
	cr:     'affiliatewp-checkout-referrals',
	dbs:    'affiliatewp-affiliate-dashboard-sharing',
	dlt:    'affiliatewp-direct-link-tracking',
	docs:   'affwp-docs',
	erl:    'external-referral-links',
	flag:   'affiliatewp-flag-affiliates',
	force:  'affwp-force-pending-referrals',
	gf:     'affiliatewp-affiliate-forms-gravity-forms',
	info:   'affiliatewp-affiliate-info',
	labs:   'affiliatewp-labs',
	lb:     'affiliatewp-leaderboard',
	lc:     'affiliate-wp-lifetime-commissions',
	lp:     'affiliatewp-affiliate-landing-pages',
	nf:     'affiliatewp-affiliate-forms-ninja-forms',
	od:     'affiliatewp-order-details-for-affiliates',
	pp:     'affiliate-wp-paypal-payouts',
	push:   'affiliate-wp-pushover',
	rar:    'affiliatewp-restrict-affiliate-registration',
	rest:   'affiliatewp-rest-api-extended',
	rr:     'affiliate-wp-recurring-referrals',
	rta:    'affiliatewp-restrict-to-affiliates',
	sac:    'affiliatewp-show-affiliate-coupons',
	sc:     'affiliatewp-store-credit',
	shor:   'affiliatewp-affiliate-area-shortcodes',
	signup: 'affiliatewp-signup-referrals',
	stripe: 'affiliate-wp-stripe-payouts',
	sub:    'affiliatewp-sign-up-bonus',
	survey: 'affiliatewp-survey-discounts',
	tabs:   'affiliatewp-affiliate-area-tabs',
	tiered: 'affiliatewp-tiered-affiliate-rates',
	usage:  'affwp-usage-tracking',
	wcra:   'affiliatewp-woocommerce-redirect-affiliates',
	zap:    'affiliatewp-zapier'
};

var EDDRepoMap = {

};

var RCPRepoMap = {

};

var SHRepoMap = {
	claws: 'claws',
	cs:    'coding-standards'
};

slack.login();