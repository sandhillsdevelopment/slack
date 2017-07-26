#!/usr/bin/env node
var Client  = require('slack-client'),
	request = require('request'),
	fs      = require('fs');

module.exports = Client;

// Create a new bot at https://YOURSLACK.slack.com/services/new/bot
var BOT_TOKEN = 'xoxb-215585930114-ndEzrGimPtXheUbyZ5pUgrHa';
var AUTH_TOKEN = fs.readFileSync( './secrets' );

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
	if (message.type === 'message' && message.hasOwnProperty('text') ) {

		if ( message.text.indexOf('#') > -1 ) {

			var issueNum = message.text.substr(message.text.indexOf('#')).split(' ')[0];
			var abbr     = issueNum.match( /[a-z]+/ );

			console.log('Detected');
			console.log(issueNum);
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
					token = AUTH_TOKEN.toString(),
					options = {
						url: 'https://api.github.com/repos/' + repo + '/issues/' + issueNum.substr(1),
						method: 'GET',
						headers: {
							'User-Agent':   'Super Agent/0.0.1',
							'Content-Type': 'application/x-www-form-urlencoded',
							'Authorization': 'token ' + token
						}
					};

				console.log( options );

				//Github API requires User Agent
				request(options, function (error, response, body) {
					var json = JSON.parse(body);
					if (!error && response.statusCode == 200) {
						issueDescription = "[#" + json.number + "] " + json.title + "\n " + json.html_url;
						channel.send(issueDescription)
					} else {
						console.log( error );
					}

					// console.log( response.headers );
				});
			}

		} else if ( message.text.match( /^\<@U6BH7TC3C\>\slist$/ ) ) {

			var mapObject, toPrint = '';

			switch( channel.name ) {
				case 'affwp-general':
				case 'affwp-docs':
				case 'affwp-support':
					mapObject = AffWPRepoMap;
					break;

				case 'edd-general':
				case 'edd-docs':
				case 'edd-support':
					mapObject = EDDRepoMap;
					break;

				case 'rcp-general':
				case 'rcp-support':
					mapObject = RCPRepoMap;
					break;
			}

			if ( null !== mapObject ) {
				for ( var prop in mapObject ) {
					if ( 'undefined' !== prop ) {
						toPrint += prop + " : " + mapObject[prop] + "\n";
					}
				}

				channel.send( "```" + toPrint + "```" );

			} else {

				console.log( "Nothing to print." );

			}


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
	aa:      'edd-all-access',
	aato:    'edd-attach-accounts-to-orders',
	adtp:    'edd-add-discount-to-payment',
	ar:      'edd-auto-register',
	as:      'edd-additional-shortcodes',
	acs:     'edd-acquisition-survey',
	api:     'edd-api-docs',
	audio:   'edd-audio',
	auth:    'edd-authorize-net',
	aweber:  'edd-aweber',
	bblrt:   'bbPress-Lock-Resolved-Topics',
	bbs:     'EDD-bbPress-Support',
	bbts:    'bbPress-Topic-Subscribers',
	beer:    'beer-hunt',
	bt:      'edd-braintree',
	cb:      'edd-coinbase',
	cc:      'edd-constant-contact',
	cnc:     'edd-connect-client',
	clc:     'edd-clickatell-connect',
	cstc:    'EDD-Customerio-Connect',
	cwc:     'edd-clockwork-connect',
	cd:      'edd-custom-deliverables',
	ce:      'EDD-Conditional-Emails',
	cf:      'edd-checkout-fields',
	cg:      'EDD-Cardsave-Gateway',
	cg:      'EDD-Conditional-Gateways',
	checks:  'edd-checks-gateway',
	ci:      'edd-coupon-importer',
	clear:   'edd-clear-cart',
	cli:     'edd-cli-tools',
	clim:    'edd-cli-migration',
	ck:      'edd-convertkit',
	cns:     'edd-connect-server',
	comm:    'EDD-Commissions',
	cont:    'edd-continue-shopping',
	cp:      'edd-compare-products',
	cr:      'EDD-Content-Restriction',
	csr:     'edd-conditional-success-redirects',
	csu:     'edd-cross-sell-upsell',
	csvmgr:  'EDD-CSV-Manager',
	das:     'edd-downloads-as-services',
	db:      'edd-digital-badge',
	dd:      'edd-duplicate-downloads',
	debug:   'debug-bar-edd',
	di:      'EDD-Dynamic-Icon',
	dlea:    'edd-download-email-attachments',
	dli:     'edd-download-images',
	dp:      'edd-discounts-pro',
	dw:      'EDD-Discount-Widget',
	empty:   'edd-empty-cart',
	ep:      'EDD-External-Products',
	fav:     'edd-favorites',
	fd:      'edd-featured-downloads',
	fdg:     'edd-gateway-firstdata',
	fdt:     'edd-free-download-text',
	fes:     'edd-fes',
	fesddg:  'edd-fes-ddg',
	feshp:   'EDD-FES-Honey-Pot',
	fespu:   'fes-product-updates',
	fraud:   'edd-fraud-monitor',
	free:    'edd-free-downloads',
	gb:      'EDD-Geckoboard',
	gfees:   'edd-gateway-fees',
	gfhss:   'gravity-forms-help-scout-search',
	git:     'edd-git-download-updater',
	gr:      'EDD-GetResponse',
	hide:    'edd-hide-download',
	hbp:     'EDD-Hide-Button-Prices',
	hsce:    'edd-helpscout-chrome-extension',
	hte:     'EDD-htaccess-Editor',
	inv:     'edd-invoices',
	ios:     'edd-ios',
	kb:      'EDD-Knowledge-Base',
	lh:      'EDD-License-handler',
	lockdl:  'edd-lock-downloads-to-ip',
	mail:    'edd-mailpoet',
	mc:      'edd-mail-chimp',
	mcsc:    'mailchimp-subscriber-count',
	mp:      'edd-manual-purchases',
	msg:     'edd-message',
	nf:      'ninjaforms-edd-checkout',
	omd:     'edd-optinmonster-discounts',
	payeezy: 'edd-payeezy',
	payza:   'edd-payza',
	pb:      'EDD-Product-Badges',
	pc:      'edd-prevent-checkout',
	pcc:     'EDD-Prevent-Country-Checkout',
	pdf:     'edd-pdf-invoices',
	pdfs:    'EDD-PDF-Stamper',
	pg:      'edd-purchase-gravatars',
	piw:     'EDD-Payment-Icons-Widget',
	pl:      'EDD-Purchase-Limit',
	pm:      'EDD-Password-Meter',
	pmcs:    'edd-recurring-payments-pmcs',
	ppe:     'edd-per-product-emails',
	pr:      'edd-purchase-rewards',
	ps:      'edd-pagseguro',
	pt:      'edd-pricing-tables',
	qr:      'easy-digital-downloads-qr-code',
	rcpmd:   'edd-rcp-member-discounts',
	rec:     'edd-recurring',
	recount: 'EDD-Recount-Earnings',
	recurly: 'edd-recurly',
	reviews: 'edd-reviews',
	rgs:     'edd-remove-german-subscriptions',
	rp:      'edd-recommended-products',
	rvi:     'edd-recently-viewed-items',
	s3:      'edd-amazon-s3',
	sb:      'edd-status-board',
	scg:     'EDD-Simplify-Commerce-Gateway',
	sf:      'shop-front',
	sfb:     'edd-sofort-banking',
	sh:      'EDD-Store-Hours',
	sl:      'EDD-Software-Licensing',
	slrenew: 'edd-sl-renew-all-keys',
	social:  'edd-social-discounts',
	ss:      'EDD-Simple-Shipping',
	stripe:  'edd-stripe',
	tally:   'wp-tally-connect',
	tools:   'edd-dev-tools',
	tpp:     'edd-terms-per-product',
	uf:      'edd-upload-file',
	upe:     'EDD-UserPro-Embed',
	usage:   'edd-usage-tracking',
	vault:   'EDD-Vault',
	vd:      'EDD-Variable-Defaults',
	vdisc:   'EDD-Volume-Discounts',
	vendd:   'vendd',
	vero:    'EDD-Vero-Connect',
	vpd:     'edd-variable-pricing-descriptions',
	vps:     'edd-variable-pricing-switcher',
	wallet:  'edd-wallet',
	wp:      'edd-widgets-pack',
	wl:      'edd-wish-lists',
	zap:     'zapier',

};

var RCPRepoMap = {

};

var SHRepoMap = {
	claws: 'claws',
	cs:    'coding-standards'
};

slack.login();