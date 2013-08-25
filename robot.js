
function createRobotPhysics ( world, robot ) {
  var fixDef = new Box2D.Dynamics.b2FixtureDef
  fixDef.density = 0.1
  fixDef.friction = 0.9
  fixDef.restitution = 0.01
  fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape
  fixDef.shape.SetAsBox ( robot.width / 2, robot.width / 2 )
  var bodyDef = new Box2D.Dynamics.b2BodyDef
  bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody
  bodyDef.position.x = robot.x
  bodyDef.position.y = robot.y
  var body = world.CreateBody(bodyDef)
  body.CreateFixture(fixDef)

  var frictionDef = new Box2D.Dynamics.Joints.b2FrictionJointDef;
  frictionDef.bodyA = world.GetGroundBody ( )
  frictionDef.bodyB = body
  frictionDef.localAnchorB = vectorOfArray ( robot.leftWheelLocalPos ( ) )
  frictionDef.maxForce = 0.05
  frictionDef.maxTorque = 0.005
  var frictionJoint = world.CreateJoint(frictionDef)
  frictionJoint.m_linearMass = Box2D.Common.Math.b2Mat22.FromAngle ( robot.theta + Math.PI * 0.5)
  frictionDef.localAnchorB = vectorOfArray ( robot.rightWheelLocalPos ( ) )
  frictionJoint = world.CreateJoint(frictionDef)
  frictionJoint.m_linearMass = Box2D.Common.Math.b2Mat22.FromAngle ( robot.theta + Math.PI * 0.5 )
  return body
  }

var view = {
  x: 0.0,
  y: 0.0,
  pixelsPerMeter: 30.0,
  fromMeters: function (x, y) {
    var x_px = (x + this.x) * this.pixelsPerMeter
    var y_px = (y + this.y) * this.pixelsPerMeter
    return [x_px, y_px]
    },
  fromPixels: function (x, y) {
    var x_m = (x / this.pixelsPerMeter) - this.x
    var y_m = (y / this.pixelsPerMeter) - this.y
    return [x_m, y_m]
    },
  xFromPixels: function (x) {
    return (x / this.pixelsPerMeter) - this.x
    },
  yFromPixels: function (y) {
    return (y / this.pixelsPerMeter) - this.y
    },
  xFromMeters: function (x) {
    return (x + this.x) * this.pixelsPerMeter
    },
  yFromMeters: function (y) {
    return (y + this.y) * this.pixelsPerMeter
    },
  scaleMeters: function (meters) {
    return meters * this.pixelsPerMeter;
    },
  scalePixels: function (pixels) {
    return pixels / this.pixelsPerMeter;
    }
  };

function vectorOfArray (array) {
  return Box2D.Common.Math.b2Vec2.Make (array[0], array[1])
  }

function arrayAngle ( angle ) {
    return [Math.cos ( angle ), Math.sin ( angle )]
  }

function vectorAngle (angle) {
  return Box2D.Common.Math.b2Vec2.Make ( Math.cos ( angle ), Math.sin ( angle ) )
  }

function vectorAngleMag (angle, magnitude) {
  return Box2D.Common.Math.b2Vec2.Make ( magnitude * Math.cos ( angle ),
                                         magnitude * Math.sin ( angle ) )
  }

(function() {
  var width = 800
  var height = 800
  var paper = Raphael(document.getElementById('raphael-container'), width, height)
  //var paper = Raphael(0, 0, width, height)

  var robot = {
  x: view.xFromPixels ( width / 2 ),
  y: view.yFromPixels ( height / 4 ),
  theta: 0.0,
  width: (1.0 + Math.random()) * 1.5,
  lspeed: 0.1,
  rspeed: 0.07,
  rightWheelLocalPos: function ( ) {
    var vec = arrayAngle ( this.theta + Math.PI * 0.5 )
    vec[0] *= this.width / 2;
    vec[1] *= this.width / 2;
    return vec
    },
  rightWheelPos: function ( ) {
    var vec = arrayAngle ( this.theta + Math.PI * 0.5 )
    vec[0] *= this.width / 2;
    vec[1] *= this.width / 2;
    return [vec[0] + this.x, vec[1] + this.y]
    },
  leftWheelLocalPos: function ( ) {
    var vec = arrayAngle ( this.theta - Math.PI * 0.5 )
    vec[0] *= this.width / 2;
    vec[1] *= this.width / 2;
    return vec
    },
  leftWheelPos: function ( ) {
    var vec = arrayAngle ( this.theta - Math.PI * 0.5 )
    vec[0] *= this.width / 2;
    vec[1] *= this.width / 2;
    return [vec[0] + this.x, vec[1] + this.y]
    },
  forward: function ( ) {
    return [Math.cos ( this.angle ), Math.sin ( this.angle )]
    }
  }

  var robotRect = paper.rect(0, 0,
    view.scaleMeters ( robot.width ),
    view.scaleMeters ( robot.width ), 0)
  robotRect.attr('fill', '#333')
  robotRect.attr('stroke', '#000')

  var robotCenterWidthPx = 8
  var robotCenter = paper.rect(0, 0, robotCenterWidthPx, robotCenterWidthPx, 4)
  robotCenter.attr('fill', '#f33')
  robotCenter.attr('stroke', '#000')
  robotCenter.toFront()

  var wheelWidth = robot.width / 4
  var wheelWidthPx = view.scaleMeters ( wheelWidth )
  var leftWheelRect = paper.rect(0, 0,
    wheelWidthPx, wheelWidthPx, 4)
  leftWheelRect.attr('fill', '#338')
  leftWheelRect.attr('stroke', '#000')

  var rightWheelRect = paper.rect(0, 0,
    wheelWidthPx, wheelWidthPx, 4)
  rightWheelRect.attr('fill', '#338')
  rightWheelRect.attr('stroke', '#000')


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

  var b2Vec2 = Box2D.Common.Math.b2Vec2
   ,  b2AABB = Box2D.Collision.b2AABB
   ,  b2BodyDef = Box2D.Dynamics.b2BodyDef
   ,  b2Body = Box2D.Dynamics.b2Body
   ,  b2FixtureDef = Box2D.Dynamics.b2FixtureDef
   ,  b2Fixture = Box2D.Dynamics.b2Fixture
   ,  b2World = Box2D.Dynamics.b2World
   ,  b2MassData = Box2D.Collision.Shapes.b2MassData
   ,  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
   ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
   ,  b2DebugDraw = Box2D.Dynamics.b2DebugDraw
 
 var world = new b2World(
       new b2Vec2(0, 0)
     , true
     )
 
  var fixDef = new b2FixtureDef
  fixDef.density = 0.1
  fixDef.friction = 0.5
  fixDef.restitution = 0.2
 
  var bodyDef = new b2BodyDef;
 
  bodyDef.type = b2Body.b2_staticBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(view.scalePixels (800), view.scalePixels (0));
  bodyDef.position.Set(view.scalePixels (400), view.scalePixels (800));
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(view.scalePixels (400), view.scalePixels(0));
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  fixDef.shape.SetAsBox(view.scalePixels(0), view.scalePixels(800));
  bodyDef.position.Set(view.scalePixels(0), view.scalePixels(400));
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(view.scalePixels(800), view.scalePixels(0));
  world.CreateBody(bodyDef).CreateFixture(fixDef);

  var drawDebug = false
  //setup debug draw
  var debugDraw
  if (drawDebug) {
    debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
    debugDraw.SetDrawScale(view.pixelsPerMeter);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);
    }

  var robotBody = createRobotPhysics ( world, robot )

  function render ( ) {
    var pos = robotBody.GetPosition ( )
    robot.x = pos.x
    robot.y = pos.y
    robot.theta = robotBody.GetAngle ( )
    var degrees = degreesOf ( robot.theta )
    var rotate = ['R', degrees]
    var loc = [ view.xFromMeters(robot.x - robot.width / 2),
                view.yFromMeters(robot.y - robot.width / 2)]
    var cloc = [ view.xFromMeters(robot.x),
                 view.yFromMeters(robot.y)]
    robotRect.attr('transform', rotate)
    robotRect.attr('x', loc[0])
    robotRect.attr('y', loc[1])
    robotCenter.attr('x', cloc[0] - robotCenterWidthPx / 2)
    robotCenter.attr('y', cloc[1] - robotCenterWidthPx / 2)
    var lwpos = robot.leftWheelPos ( )
    leftWheelRect.attr('transform', rotate)
    leftWheelRect.attr('x', view.xFromMeters ( lwpos[0] - wheelWidth / 2))
    leftWheelRect.attr('y', view.yFromMeters ( lwpos[1] - wheelWidth / 2))

    var rwpos = robot.rightWheelPos ( )
    rightWheelRect.attr('transform', rotate)
    rightWheelRect.attr('x', view.xFromMeters ( rwpos[0] - wheelWidth / 2))
    rightWheelRect.attr('y', view.yFromMeters ( rwpos[1] - wheelWidth / 2))
    }

  function applyForces ( ) {
    robotBody.ApplyForce ( vectorAngleMag ( robot.theta, robot.lspeed ),
                           vectorOfArray ( robot.leftWheelPos ( ) ) )
    robotBody.ApplyForce ( vectorAngleMag ( robot.theta, robot.rspeed ),
                           vectorOfArray ( robot.rightWheelPos ( ) ) )
    }

  function update ( ) {
    applyForces ( )
    world.Step(1 / 60, 10, 10)
    render ( )
    if (drawDebug) {
      world.DrawDebugData();
      }
    world.ClearForces()
    }

  window.setInterval(update, 1000 / 60);
})()
