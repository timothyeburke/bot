// Description:
// Let's get some pivotal ticket info
// Commands:
//   listens on pivotaltracker.com tickets like https://www.pivotaltracker.com/story/show/blah

var _ = require('lodash')
var Q = require('q')

module.exports = function(robot) {
    var apiToken = process.env.HUBOT_PIVOTALTRACKER_API_TOKEN
    var baseUrl = 'https://www.pivotaltracker.com/services/v5'

    function formatData(ticketName, description, owners, requester, labels, state, url, room) {
        return {
            ticketName: ticketName,
            description: description ? description : '',
            owners: owners,
            requester: requester,
            labels: labels,
            state: state,
            url: url,
            room: room
        }
    }

    function formatAttachment(data) {
        var attachment = {
            fallback: 'text',
            author_name: data.requester,
            title: data.ticketName,
            title_link: data.url,
            mrkdwn_in: ['text', 'fields'],
            text: data.description.replace(/\*\*/g, '*'),
            fields: [
                {
                    title: "State",
                    value: _.capitalize(data.state),
                    short: true
                },
                {
                    title: 'Owners',
                    value: _.isEmpty(data.owners) ? 'No owners :look_of_disapproval:' : data.owners.join(', '),
                    short: true
                }
            ]
        }

        if (data.state === 'delivered') {
            attachment.color = '#f39300'
        } else if (data.state === 'finished') {
            attachment.color = '#203e64'
        } else if (data.state === 'unstarted') {
            attachment.color = '#e0e2e5'
        } else if (data.state === 'accepted') {
            attachment.color = '#629200'
        } else if (data.state === 'rejected') {
            attachment.color = '#A71f39'
        } else {
            attachment.color = '#E0E2E5'
        }

        return attachment
    }

    function getProjectMembers(projectId) {
        var deferred = Q.defer()

        robot.http(baseUrl + '/projects/' + projectId + '/memberships').header('X-TrackerToken', apiToken).get()(function(err, res, body) {
            if (err) {
                deferred.reject('Error fetching project members from pivotal.')
            } else {
                deferred.resolve(JSON.parse(body))
            }
        })

        return deferred.promise
    }

    function getStoryData(storyId) {
        var deferred = Q.defer()

        robot.http(baseUrl + '/stories/' + storyId).header('X-TrackerToken', apiToken).get()(function(err, res, body) {
            if (err) {
                deferred.reject('Error fetching story data from pivotal.')
            } else {
                deferred.resolve(JSON.parse(body))
            }
        })

        return deferred.promise
    }

    robot.hear(/(https:\/\/www.pivotaltracker.com\/story\/show\/\d+)/ig, function(msg) {
        var matches
        matches = msg.match

        _.each(matches, function(urlMatch) {
            var storyId
            storyId = urlMatch.split('https://www.pivotaltracker.com/story/show/')[1]

            getStoryData(storyId).then(function(data) {
                return Q.all([data, getProjectMembers(data.project_id)])
            }).then(function(data) {
                var story = data[0]
                var members = data[1]

                var description = story.description
                var labels = _.map(story.labels, 'name')
                var ownerIds = story.owner_ids
                var owners = _.map(ownerIds, function(ownerId) {
                    return _.find(members, {
                        person: {
                            id: ownerId
                        }
                    }).person.name
                })
                var projectId = story.project_id
                var requester = _.find(members, {
                    person: {
                        id: story.requested_by_id
                    }
                }).person.name
                var room = msg.envelope.room
                var state = story.current_state
                var ticketName = story.name
                var url = story.url


                var data = formatData(ticketName, description, owners, requester, labels, state, url, room)
                var attachment = formatAttachment(data)

                msg.send({
                    attachments: [attachment]
                })
            }).catch(function(data) {
                msg.send('Something went wrong.')
            })
        })
    })
}
