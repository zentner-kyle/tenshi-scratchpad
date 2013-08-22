
function createRobotPhysics ( world, robot ) {
  var fixDef = new Box2D.Dynamics.b2FixtureDef
  fixDef.density = 100.0
  fixDef.friction = 0.5
  fixDef.restitution = 0.2
  fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape
  fixDef.shape.SetAsBox ( robot.width / 2, robot.width / 2 )
  var bodyDef = new Box2D.Dynamics.b2BodyDef
  bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody
  bodyDef.position.x = robot.x
  bodyDef.position.y = robot.y
  var body = world.CreateBody(bodyDef)
  body.CreateFixture(fixDef)
  return body
  }

function toPixels (cord) {
  return cord
  return (cord - 1.8) / 30
  }

//var View = function (old) {
  //return {
    //x: 0.0,
    //y: 0.0,
    //pixelsPerMeter: 30,
    //fromMeters: function (x, y) {
      //var x_px = (x + this.x) * this.pixelsPerMeter
      //var y_px = (y + this.y) * this.pixelsPerMeter
      //return [x_px, y_px]
      //},
    //fromPixels: function (x, y) {
      //var x_m = (x / this.pixelsPerMeter) - this.x
      //var y_m = (y / this.pixelsPerMeter) - this.y
      //return [x_m, y_m]
      //}
    //}
  //};

//var view = new View;

var view = {
  x: 0.0,
  y: 0.0,
  pixelsPerMeter: 30,
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

(function() {
  //var paper = Raphael(document.getElementById('raphael-container'), 800, 800)
  var paper = Raphael(0, 0, 800, 800)

  var robot = {}
  robot.x = view.xFromPixels ( 200 )
  robot.y = view.yFromPixels ( 200 )
  robot.theta = 0.0
  robot.width = 1.0
  robot.lspeed = .09
  robot.rspeed = .1

  var robotRect = paper.rect(0, 0,
    view.scaleMeters ( robot.width ),
    view.scaleMeters ( robot.width ), 4)
  robotRect.attr('fill', '#333')
  robotRect.attr('stroke', '#000')


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

  //function robotActivity (robot) {
    //return Math.sqrt(robot.lspeed * robot.lspeed + robot.rspeed * robot.rspeed) / 2
    //}

  //function updateRobotPosition (robotRect) {
    //var waitTime = 15
    //drive(robot, waitTime)
    //var degrees = Math.floor(degreesOf(robot.theta))
    //robotRect.transform('t' + robot.x + ',' + robot.y + 'r' + degrees)
    //if (robotActivity (robot) == 0) {
      //window.setTimeout(function () {updateRobotPosition (robotRect)}, 500)
      //}
    //else {
      //window.setTimeout(function () {updateRobotPosition (robotRect)}, waitTime)
      //}
    //}
  //updateRobotPosition(robotRect)

  var b2Vec2 = Box2D.Common.Math.b2Vec2
   ,  b2AABB = Box2D.Collision.b2AABB
   ,  b2BodyDef = Box2D.Dynamics.b2BodyDef
   ,  b2Body = Box2D.Dynamics.b2Body
   ,  b2FixtureDef = Box2D.Dynamics.b2FixtureDef
   ,  b2Fixture = Box2D.Dynamics.b2Fixture
   ,  b2World = Box2D.Dynamics.b2World
   ,  b2MassData = Box2D.Collision.Shapes.b2MassData
   ,  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
   ,  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
   ,  b2DebugDraw = Box2D.Dynamics.b2DebugDraw
   ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
 
 var world = new b2World(
       new b2Vec2(0, 10)
     , true
     )
 
  var fixDef = new b2FixtureDef
  fixDef.density = 1.0
  fixDef.friction = 0.5
  fixDef.restitution = 0.2
 
  var bodyDef = new b2BodyDef;
 
  bodyDef.type = b2Body.b2_staticBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(view.scalePixels (800), view.scalePixels (10));
  bodyDef.position.Set(view.scalePixels (400), view.scalePixels (800));
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(10, -1.8);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  fixDef.shape.SetAsBox(2, 14);
  bodyDef.position.Set(-1.8, 13);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(800 / 30 + 1.8, 13);
  world.CreateBody(bodyDef).CreateFixture(fixDef);

  var debugBody
  //create some objects
  bodyDef.type = b2Body.b2_dynamicBody;
  for(var i = 0; i < 10; ++i) {
     if(Math.random() > 0.5) {
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(
              Math.random() + 0.1 //half width
           ,  Math.random() + 0.1 //half height
        );
     } else {
        fixDef.shape = new b2CircleShape(
           Math.random() + 0.1 //radius
        );
     }
     bodyDef.position.x = Math.random() * 10;
     bodyDef.position.y = Math.random() * 10;
     debugBody = world.CreateBody(bodyDef)
     debugBody.CreateFixture(fixDef);
  }


  var debugDraw = new b2DebugDraw();
                  debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
                  debugDraw.SetDrawScale(30.0);
                  debugDraw.SetFillAlpha(0.5);
                  debugDraw.SetLineThickness(1.0);
                  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
                  world.SetDebugDraw(debugDraw);
  var robotBody = createRobotPhysics ( world, robot )

  function updateRobot ( ) {
    var pos = robotBody.GetPosition ( )
    robot.x = pos.x
    robot.y = pos.y
    var degrees = degreesOf ( robotBody.GetAngle ( ) )
    robotRect.transform('t' + view.xFromMeters(robot.x) + ',' +
                              view.yFromMeters(robot.y) +
                        'r' + degrees)
    }

  function update() {
    world.Step(1 / 60, 10, 10)
    world.DrawDebugData()
    updateRobot ( )
    world.ClearForces()
    }
  window.setInterval(update, 1000 / 60);
})()
