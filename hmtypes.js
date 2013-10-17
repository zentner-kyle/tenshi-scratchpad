// ## Type variable
//
// A type variable represents an parameter with an unknown type or any
// polymorphic type. For example:
//
//     fun id x = x
//
// Here, `id` has the polymorphic type `'a -> 'a`.
var require = require;
var export_val;
var exported_symbols = [];
if ( require === undefined ) {
  export_val = function ( name, val ) {
    exported_symbols.push ( name );
    };
  require = function ( filename ) {
    return components.utils.import("chrome://angel-player/content/angelic/" + filename);
    };
  }
else {
  export_val = function ( name, val ) {
    exports[name] = val;
    };
  }

var Variable = function() {
    this.id = Variable.nextId;
    Variable.nextId++;
    this.instance = null;
};
Variable.nextId = 0;
export_val( 'Variable', Variable);
// Type variables should look like `'a`. If the variable has an instance, that
// should be used for the string instead.
Variable.prototype.toString = function() {
    if(!this.instance) {
        return "'" + String.fromCharCode("a".charCodeAt(0) + this.id);
    }
    return this.instance.toString();
};

// ## Base type
//
// Base type for all specific types. Using this type as the prototype allows the
// use of `instanceof` to detect a type variable or an actual type.
var BaseType = function(name, types) {
    this.name = name;
    this.types = types;
};
BaseType.prototype.toString = function() {
    var typeString;
    if(this.types.length) {
        typeString = this.types.map(function(type) {
            return type.toString();
        }).toString();
        return this.name + "(" + typeString + ")";
    }
    return this.name;
};
export_val( 'BaseType', BaseType);

// ## Specific types
//
// A `FunctionType` contains a `types` array. The last element represents the
// return type. Each element before represents an argument type. 
var FunctionType = function(types) {
    this.types = types;
};
FunctionType.prototype = new BaseType("Function");
export_val( 'FunctionType',FunctionType);

var NumberType = function() {};
NumberType.prototype = new BaseType("Number", []);
export_val('NumberType', NumberType);

var StringType = function() {};
StringType.prototype = new BaseType("String", []);
export_val( 'StringType', StringType);