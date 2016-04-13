// Description:
// Statements of inspiration and tranquility.
//
// Commands:
//   hubot zen me - say something nice

module.exports = function(robot) {
    robot.respond(/zen (me|us)/i, function(msg) {
        var url = 'https://api.github.com/zen'
        msg.http(url).get()(function(err, res, body) {
            msg.send(body)
        })
    })
}
