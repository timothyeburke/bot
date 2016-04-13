// Description:
// Pictures of kittens.
//
// Commands:
//   hubot kitten me - show me a kitten

function randomNumber() {
    return Math.floor(Math.random() * 1000) + 200
}

module.exports = function(robot) {
    robot.respond(/kitten (me|us)/i, function(msg) {
        var width = randomNumber()
        var height = randomNumber()
        var url = 'http://placekitten.com/' + width + '/' + height
        msg.send(url)
    })
}
