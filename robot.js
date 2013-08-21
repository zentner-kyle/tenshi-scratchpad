
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

var theme = 'pegman'
theme = theme + '/'

function getRobotImageName(degrees) {
  return theme + degrees + '.jpg'
  }

var maxAngle = 359
var robotImages = new Array()
for (var i = 0; i <= maxAngle; i++) {
  robotImages[i] = new Image()
  robotImages[i].src = getRobotImageName(i)
  robotImages[i].id = 'robot-image'
  }

function updateRobotPosition () {
  var robot_div = document.getElementById('robot')
  robot_div.style.left = robot.x + 'px'
  robot_div.style.top  = robot.y + 'px'
  var degrees = (359 - Math.floor(degreesOf(robot.theta)))
  var robot_image = document.getElementById('robot-image')
  robot_div.replaceChild(robotImages[degrees], robot_image)
  var waitTime = 15
  drive(robot, waitTime)
  window.setTimeout(updateRobotPosition, waitTime)
  }
updateRobotPosition()
