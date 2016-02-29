// Description:
// Let's get some github pull request info
//
// Commands:
//   listens for github.com pull request urls like https://github.com/foo/foo-api/pull/975

'use strict';
var _ = require('lodash');
var Q = require('q');

function formatPr(pr, issue, msg) {
    var attachment = {
        channel: msg.envelope.room,
        content: {
            title: pr.title + ' #' + pr.number,
            title_link: pr.html_url,
            text: '*' + pr.user.login + '* wants to merge ' + pr.commits + ' commit' + (pr.commits !== 1 ? 's' : '') + ' into \`' + pr.base.ref + '\` from \`' + pr.head.ref + '\`',
            color: '#000000',
            fallback: pr.title + '#' + pr.number,
            author_name: pr.user.login,
            author_link: pr.user.html_url,
            author_icon: pr.user.avatar_url,
            mrkdwn_in: ['text']
        }
    };

    // if (issue.labels.length) {
    //     attachment.content.fields = [{
    //         title: 'Labels',
    //         value: issue.labels.map(function(label) {
    //             return '[' + label.name + ']';
    //         }).join('\n'),
    //         short: true
    //     }]
    // }

    var state = pr.state;
    if (pr.state === 'closed') {
        if (pr.merged) {
            attachment.content.color = '#6E5497';
            state = 'merged';
        } else {
            attachment.content.color = '#BE2A00';
        }
    } else {
        attachment.content.color = '#6AC631';
    }
    attachment.content.text = '`[' + _.capitalize(state) + ']` ' + attachment.content.text;

    return attachment;
}

function getUrl(url, msg) {
    var apiToken = process.env.HUBOT_GITHUB_API_TOKEN;
    var deferred = Q.defer();

    msg.http(url).header('Authorization', 'token ' + apiToken).get()(function(err, res, body) {
        if (err) {
            deferred.reject(err);
        }
        try {
            var data = JSON.parse(body);
            deferred.resolve(data);
        } catch (e) {
            deferred.reject(err);
        }
    });

    return deferred.promise;
}

module.exports = function(robot) {
    robot.hear(/https\:\/\/(?:www\.)?github\.com\/(([A-Za-z0-9\-])+)\/(([A-Za-z0-9\-])+)\/pulls/gi, function(msg) {
        msg.send('PEOPLE. There are pull requests to review.');
    });

    robot.hear(/https\:\/\/(?:www\.)?github\.com\/(([A-Za-z0-9\-])+)\/(([A-Za-z0-9\-])+)\/pull\/([\d]+)/gi, function(msg) {
        var urls = msg.message.text.match(/https\:\/\/(?:www\.)?github\.com\/(([A-Za-z0-9\-])+)\/(([A-Za-z\-])+)\/pull\/([\d]+)/gi);
        _.each(urls, function(url) {
            var matches = /https\:\/\/(?:www\.)?github\.com\/(([A-Za-z0-9\-])+)\/(([A-Za-z0-9\-])+)\/pull\/([\d]+)/gi.exec(url);
            var owner = matches[1];
            var project = matches[3];
            var pull = matches[5];
            var baseUrl = 'https://api.github.com/repos/' + owner + '/';

            var pullRequestUrl = baseUrl + project + '/pulls/' + pull;
            var issueUrl = baseUrl + project + '/issues/' + pull;

            Q.all([
                getUrl(pullRequestUrl, msg),
                getUrl(issueUrl, msg)
            ]).then(function(data) {
                var pr = data[0];
                var issue = data[1];
                robot.emit('slack.attachment', formatPr(pr, issue, msg));
            });
        });
    });
};
