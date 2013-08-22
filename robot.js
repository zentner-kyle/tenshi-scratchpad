(function() {

  var paper = Raphael(20, 20, 800, 800)

  var robotRect = paper.rect(100, 100, 50, 50, 4)
  robotRect.attr('fill', '#333')
  robotRect.attr('stroke', '#000')

  var robot = {}
  robot.x = 400.0
  robot.y = 200.0
  robot.theta = 0.0
  robot.width = 10.0
  robot.lspeed = .09
  robot.rspeed = .1

  function drive(robot, delta_t) {
    var ldiff = robot.lspeed * delta_t
    , rdiff = robot.rspeed * delta_t
    , omega = (rdiff - ldiff) / robot.width
    , v = (rdiff + ldiff) / 2.0
    robot.x += v * Math.cos(robot.theta)
    robot.y += v * Math.sin(robot.theta)
    robot.theta += (Math.PI * 2 + omega) % (Math.PI * 2)
    }

  function degreesOf(radians) {
    return ((180 * radians) / Math.PI) % 360
    }

  var lastWaitTime = 15

  var maxAngle = 359

  function robotActivity (robot) {
    return Math.sqrt(robot.lspeed * robot.lspeed + robot.rspeed * robot.rspeed) / 2
    }

  function updateRobotPosition (robotRect) {
    var waitTime = 15
    drive(robot, waitTime)
    var degrees = Math.floor(degreesOf(robot.theta))
    robotRect.transform('t' + robot.x + ',' + robot.y + 'r' + degrees)
    if (robotActivity (robot) == 0) {
      window.setTimeout(function () {updateRobotPosition (robotRect)}, 500)
      }
    else {
      window.setTimeout(function () {updateRobotPosition (robotRect)}, waitTime)
      }
    }
  updateRobotPosition(robotRect)

  function stop() {
    robot.lspeed = 0
    robot.rspeed = 0
    }
})();
