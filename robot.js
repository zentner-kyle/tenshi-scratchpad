'use strict'

var robot = {}
robot.x = 400.0
robot.y = 200.0
robot.theta = 0.0
robot.width = 10.0
robot.lspeed = .09
robot.rspeed = .1

function drive(robot, lspeed, rspeed, delta_t) {
  var ldiff = lspeed * delta_t
  , rdiff = rspeed * delta_t
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

function resolveURL(url, base_url) {
  var doc = document
  , old_base = doc.getElementsByTagName('base')[0]
  , old_href = old_base && old_base.href
  , doc_head = doc.head || doc.getElementsByTagName('head')[0]
  , our_base = old_base || doc_head.appendChild(doc.createElement('base'))
  , resolver = doc.createElement('a')
  , resolved_url
  ;
  our_base.href = base_url
  resolver.href = url
  resolved_url = resolver.href
   
  if (old_base) old_base.href = old_href
  else doc_head.removeChild(our_base)
   
  return resolved_url
  }

function updateRobotPosition () {
  var robot_div = document.getElementById('robot')
  robot_div.style.left = robot.x + 'px'
  robot_div.style.top  = robot.y + 'px'
  var filename = theme + (360 - Math.floor(degreesOf(robot.theta))) + '.jpg'
  filename = resolveURL(filename)
  var robot_image = document.getElementById('robot-image')
  if (robot_image.src != filename) {
    robot_image.src = filename
    }
  var waitTime = 15
  drive(robot, robot.lspeed, robot.rspeed, waitTime)
  window.setTimeout(updateRobotPosition, waitTime)
  }
updateRobotPosition()
