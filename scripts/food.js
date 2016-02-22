// Description:
// Let's get some github pull request info
//
// Commands:
//   hubot feed me - find nearby food trucks

module.exports = function(robot) {
    robot.respond(/feed me/i, function(msg) {
        var url = 'http://foodtruckfiesta.com/apps/map_json.php?num_days=365&minimal=0&alert_nc=y&alert_hc=0&alert_pm=0&rand=' + (Math.random() * 1000000);
        msg.http(url).header('Accept', 'application/json').get()(function(err, res, body) {
            if (err) {
                return;
            }

            try {
                var markers = JSON.parse(body).markers;
                var franklin = {};
                var metroCenter = {};

                markers.forEach(function(marker) {
                    var text = marker.alerttext.toLowerCase().replace(/ /g, '');
                    if (text.indexOf('tastykabob') !== -1) {
                        marker.print_name = marker.print_name.trim() + ' :party-parrot:';
                    }
                    if (text.indexOf('franklin') !== -1) {
                        franklin[marker.print_name.trim()] = marker;
                    }
                    if (text.indexOf('metrocenter') !== -1) {
                        metroCenter[marker.print_name.trim()] = marker;
                    }
                });

                var attachment = {
                    channel: msg.envelope.room,
                    content: {
                        title: 'Nearby Food Trucks',
                        title_link: 'http://foodtruckfiesta.com',
                        color: '#007700',
                        fallback: 'Nearby Food Trucks',
                        fields: [{
                            title: 'Franklin Square',
                            value: (Object.keys(franklin).length ? Object.keys(franklin).join('\n') : 'No trucks today.'),
                            short: true
                        }, {
                            title: 'Metro Center',
                            value: (Object.keys(metroCenter).length ? Object.keys(metroCenter).join('\n') : 'No trucks today.'),
                            short: true
                        }]
                    }
                }
                robot.emit('slack.attachment', attachment);
            } catch(e) {
                msg.send('Something went wrong.');
            }
        });
    });
};
