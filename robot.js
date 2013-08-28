var robotStart = {
  x: 50.0,
  y: 450.0
  }

var robotMidway = {
  x: 400.0,
  y: 260.0
  }

var robot = {
  x: robotStart.x,
  y: robotStart.y,
  theta: 0.0,
  width: 51.0,
  lspeed: 0.1,
  rspeed: 0.1
  }

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

var robotState = {
  RUNNING: 0,
  CRASHED: 1,
  FINISHED: 2
  }

function CollisionChecker(imageName) {
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')
  var image = new Image ( )
  image.src= imageName

  image.onload = function () {
    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)
    }

  this.getStatus = function(x, y) {
    var pixelData = ctx.getImageData(x, y, 1, 1).data
    if (pixelData[3] == 0) {
      return robotState.RUNNING
      }
    else if (pixelData[1] == 0xff &&
             pixelData[0] == 0    &&
             pixelData[2] == 0) {
      return robotState.FINISHED
      }
    else {
      return robotState.CRASHED
      }
    }
  }

var mazeName = 'mazes/S.png'
var maze = document.getElementById('maze')
if (maze != null) {
  maze.src = mazeName
  }

var collisionCheck = new CollisionChecker(mazeName)
var done = false

var waitTime = 15
function updateRobotPosition (deltaT) {
  if (done) {
    return
    }
  var robot_div = document.getElementById('robot')
  var field = document.getElementById('field')
  robot_div.style.left = robot.x + 'px'
  robot_div.style.top  = robot.y + 'px'
  var degrees = (359 - Math.floor(degreesOf(robot.theta)))
  var robot_image = document.getElementById('robot-image')
  robot_div.replaceChild(robotImages[degrees], robot_image)
  drive(robot, deltaT)
  var state = collisionCheck.getStatus(robot.x + robot.width / 2,
                                       robot.y + robot.width / 2)
  if (state == robotState.CRASHED) {
    alert('The robot has crashed.')
    done = true
    }
  else if (state == robotState.FINISHED) {
    alert('Congratulations! You got to the end!')
    done = true
    }
  }

function restart ( ) {
  robot.x = robotStart.x
  robot.y = robotStart.y
  done = false
  }

function midway ( ) {
  robot.x = robotMidway.x
  robot.y = robotMidway.y
  done = false
  }

window.setInterval(updateRobotPosition, waitTime, waitTime)
restart ()
